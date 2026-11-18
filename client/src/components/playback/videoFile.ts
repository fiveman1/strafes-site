/**
 * Recordings are written to a file in the site's private storage (the Origin Private File System) as they're encoded,
 * so long videos don't have to fit in memory. Each file is held with a lock while a page uses it, so a new recording
 * can delete the ones closed or crashed tabs left behind without touching another tab's.
 */

const DIRECTORY = "video-recordings";
const LOCK_PREFIX = "video-recording:";

export interface VideoFile {
    /** Where the video is written, closed by the output when it finishes or is canceled */
    writable: FileSystemWritableFileStream
    /** The finished video, read from disk when saved */
    read: () => Promise<File>
    /** Deletes the file and lets other pages clean it up if that fails */
    discard: () => Promise<void>
}

/** Takes a lock until the returned function is called. */
function holdLock(name: string) {
    return new Promise<() => void>((resolve, reject) => {
        navigator.locks.request(name, () => new Promise<void>(release => resolve(release))).catch(reject);
    });
}

async function removeLeftovers(directory: FileSystemDirectoryHandle) {
    const locks = await navigator.locks.query();
    const held = new Set(locks.held?.map(lock => lock.name));
    for await (const name of directory.keys()) {
        if (!held.has(LOCK_PREFIX + name)) {
            await directory.removeEntry(name).catch(err => console.error("Couldn't delete an old recording", err));
        }
    }
}

/** A new file to record into, or undefined if this browser can't write files this way. */
export async function createVideoFile(): Promise<VideoFile | undefined> {
    if (!navigator.storage?.getDirectory || !navigator.locks || typeof FileSystemFileHandle === "undefined"
        || !("createWritable" in FileSystemFileHandle.prototype)) {
        return undefined;
    }
    try {
        const root = await navigator.storage.getDirectory();
        const directory = await root.getDirectoryHandle(DIRECTORY, { create: true });
        await removeLeftovers(directory);
        const name = `${crypto.randomUUID()}.mp4`;
        const release = await holdLock(LOCK_PREFIX + name);
        try {
            const handle = await directory.getFileHandle(name, { create: true });
            const writable = await handle.createWritable();
            return {
                writable,
                read: () => handle.getFile(),
                discard: async () => {
                    // still open if the output never started, and an open file can't be deleted
                    if (!writable.locked) {
                        await writable.abort().catch(() => {});
                    }
                    await directory.removeEntry(name).catch(err => console.error("Couldn't delete the recording", err));
                    release();
                }
            };
        }
        catch (err) {
            release();
            throw err;
        }
    }
    catch (err) {
        console.error("Couldn't make a file to record into, recording in memory instead", err);
        return undefined;
    }
}
