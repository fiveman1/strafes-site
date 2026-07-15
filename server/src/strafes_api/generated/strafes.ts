/* eslint-disable */
/* tslint:disable */
// @ts-nocheck


export interface Error {
  error?: string;
}

export interface Map {
  display_name: string;
  game_id: number;
  id: number;
  thumbnail?: number;
}

export interface PagedResponseMap {

  data: Map[];

  pagination: Pagination;
}

export interface PagedResponseRank {

  data: Rank[];

  pagination: Pagination;
}

export interface PagedResponseTime {

  data: Time[];

  pagination: Pagination;
}

export interface PagedResponseUser {

  data: User[];

  pagination: Pagination;
}

export interface PagedTotalResponseTime {

  data: Time[];

  pagination: PaginationWithTotal;
}

export interface Pagination {

  page: number;

  page_size: number;
}

export interface PaginationWithTotal {

  page: number;

  page_size: number;

  total_items: number;

  total_pages: number;
}

export interface Rank {
  game_id: number;
  id: number;
  mode_id: number;
  rank: number;
  skill: number;
  style_id: number;
  updated_at: string;
  user: User;
}

export interface ResponseMap {

  data: Map;
}

export interface ResponseRank {

  data: Rank;
}

export interface ResponseTime {

  data: Time;
}

export interface ResponseUser {

  data: User;
}

export interface ResponseArrayTimePlacement {

  data: TimePlacement[];
}

export interface Time {
  date: string;
  game_id: number;
  has_bot: boolean;
  id: string;
  map: Map;
  mode_id: number;
  style_id: number;
  time: number;
  user: User;
}

export interface TimePlacement {
  id: string;
  placement: number;
}

export interface User {
  id: number;
  muted: boolean;
  state_id: number;
  username: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {

  secure?: boolean;

  path: string;

  type?: ContentType;

  query?: QueryParamsType;

  format?: ResponseFormat;

  body?: unknown;

  baseUrl?: string;

  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/api/v1";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok && (response.status < 300 || response.status >= 400)) throw data;
      return data;
    });
  };
}


export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  map = {

    getMap: (
      query?: {

        page_size?: number;

        page_number?: number;
        game_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PagedResponseMap, Error>({
        path: `/map`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),


    getMap2: (id: number, params: RequestParams = {}) =>
      this.request<ResponseMap, Error>({
        path: `/map/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  rank = {

    rankList: (
      query?: {

        page_size?: number;

        page_number?: number;

        sort_by?: 1 | 2;
        game_id?: number;
        mode_id?: number;
        style_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PagedResponseRank, Error>({
        path: `/rank`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  time = {

    timeList: (
      query?: {

        page_size?: number;

        page_number?: number;
        game_id?: number;
        map_id?: number;
        mode_id?: number;
        style_id?: number;
        user_id?: number;

        sort_by?: 0 | 1 | 2 | 3;
      },
      params: RequestParams = {},
    ) =>
      this.request<PagedTotalResponseTime, Error>({
        path: `/time`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),


    placementList: (
      query: {

        ids: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ResponseArrayTimePlacement, Error>({
        path: `/time/placement`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),


    worldrecordList: (
      query?: {

        page_size?: number;

        page_number?: number;
        game_id?: number;
        map_id?: number;
        mode_id?: number;
        style_id?: number;
        user_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PagedResponseTime, Error>({
        path: `/time/worldrecord`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),


    timeDetail: (id: string, params: RequestParams = {}) =>
      this.request<ResponseTime, Error>({
        path: `/time/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),


    getTime: (id: string, params: RequestParams = {}) =>
      this.request<any, void | Error>({
        path: `/time/${id}/bot`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  user = {

    userList: (
      query?: {

        page_size?: number;

        page_number?: number;
        state_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PagedResponseUser, Error>({
        path: `/user`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),


    userDetail: (id: number, params: RequestParams = {}) =>
      this.request<ResponseUser, Error>({
        path: `/user/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),


    rankList: (
      id: number,
      query: {
        game_id: number;
        mode_id: number;
        style_id: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ResponseRank, Error>({
        path: `/user/${id}/rank`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
