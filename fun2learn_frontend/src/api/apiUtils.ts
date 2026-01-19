import Cookies from "js-cookie";

/**
 * Get the headers needed to call the API
 * @param contentType accepts custom ContentType and applies to header. Defaults to Application/json
 * @returns 
 */
export function getHeaders(contentType: string = "application/json"): Headers {
  const accessToken = Cookies.get("idToken");

  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return new Headers(headers);
}

/**
 * Get raw headers object that might be used for headers customization by client
 * @param contentType accepts custom ContentType and applies to header. Defaults to Application/json
 * @returns 
 */
export function getHeadersRaw (contentType: string = "Application/json") {
    const accessToken = Cookies.get("idToken");

    const headers: Record<string, string> = {
        "Content-Type": contentType,
    };

    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return headers;
}