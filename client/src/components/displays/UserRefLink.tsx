import { UserInfo, UserRef } from "shared";
import UserLink, { IUserLinkProps } from "./UserLink";

interface UserRefLinkProps extends Omit<IUserLinkProps, keyof UserInfo> {
    user: UserRef
}

/** A UserLink for a UserRef: "User 123" for someone the site has no username for, and @username otherwise. */
function UserRefLink(props: UserRefLinkProps) {
    const { user, sx, ...linkProps } = props;
    return (
        <UserLink
            userId={user.userId}
            username={user.username ?? `User ${user.userId}`}
            userRoles={user.userRoles}
            userCountry={user.userCountry}
            userThumb={user.userThumb}
            showAt={user.username !== undefined}
            underline="hover"
            {...linkProps}
            sx={[{ fontWeight: 600, minWidth: 0, verticalAlign: "middle" }, ...(Array.isArray(sx) ? sx : [sx])]}
        />
    );
}

export default UserRefLink;
