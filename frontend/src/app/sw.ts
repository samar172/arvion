import { precacheAndRoute } from "@serwist/precaching";

declare const self: any;

precacheAndRoute(self.__SW_MANIFEST || []);
