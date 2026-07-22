import api from "../api/axios";

/**
 * Downloads a protected (JWT-authenticated) file. A plain <a href> can't
 * send the Authorization header, so we fetch the file as a blob through
 * our axios instance (which attaches the token) and trigger the save
 * dialog manually.
 */
export async function downloadFile(url, fallbackFilename) {
  const res = await api.get(url, { responseType: "blob" });
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
