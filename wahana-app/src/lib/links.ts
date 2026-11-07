import * as WebBrowser from "expo-web-browser";
import { SITE_URL } from "./env";

/** Open a page of the website (policies, help) in an in-app browser sheet. */
export const openWeb = (path: string) =>
  WebBrowser.openBrowserAsync(`${SITE_URL}${path}`, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }).catch(() => {});
