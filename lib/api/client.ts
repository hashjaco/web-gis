type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  // #region agent log
  fetch('http://127.0.0.1:7897/ingest/62820f91-a5c2-4d7a-9a0a-e64d00b67289',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'38ed0f'},body:JSON.stringify({sessionId:'38ed0f',location:'client.ts:apiFetch-pre',message:'apiFetch request',data:{url,method},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  // #region agent log
  fetch('http://127.0.0.1:7897/ingest/62820f91-a5c2-4d7a-9a0a-e64d00b67289',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'38ed0f'},body:JSON.stringify({sessionId:'38ed0f',location:'client.ts:apiFetch-post',message:'apiFetch response',data:{url,method,status:res.status,statusText:res.statusText},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (res.status >= 300 && res.status < 400) {
    throw new ApiError(res.status, "Authentication required. Please sign in.");
  }

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      if (body?.error && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // Body is not JSON — use generic message
    }
    throw new ApiError(res.status, message);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(res.status, "Unexpected response from server");
  }

  return res.json();
}
