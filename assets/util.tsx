import * as moment from "moment";
const { apiRequest } = window.wp;
const { select, dispatch } = window.wp.data;
const { getPostEdits } = select('core/editor');
const { editPost } = dispatch('core/editor');
const { dateI18n, getSettings } = window.wp.date;

import * as Web3 from "web3";
import { Civil, ApprovedRevision, EthAddress } from "@joincivil/core";
import { Newsroom } from "@joincivil/core/build/src/contracts/newsroom";

import { apiNamespace, userMetaKeys } from "./constants";

export const getCivil = (() => {
  const civil: Civil | undefined = hasInjectedProvider() ? new Civil() : undefined;
  return (): Civil | undefined => civil;
})();

export function revisionJsonSansDate(revisionJson: any): any {
  return {
    ...revisionJson,
    revisionDate: undefined,
  };
}

export async function createSignatureData(revisionJson: any): Promise<ApprovedRevision> {
  if (!revisionJson) {
    // Super edge case could only happen on a slow internet connection and if they opened sign panel and instantly hit sign before data hydrated.
    throw Error("Failed to create signature data: revisionJson is falsey");
  }
  const newsroom = await getNewsroom();
  return await newsroom!.approveByAuthorPersonalSign(revisionJson.revisionContentHash);
}

export async function getNewsroom(): Promise<Newsroom> {
  const civil = getCivil();
  const newsroomAddress = window.civilNamespace && window.civilNamespace.newsroomAddress;
  return civil!.newsroomAtUntrusted(newsroomAddress);
}

export function isCorrectNetwork(networkName: string): boolean {
  return networkName === "rinkeby"; // just hard code it for now
}

export function hasInjectedProvider(): boolean {
  return typeof window !== "undefined" && (window as any).web3 !== undefined;
}

const dateSettings = getSettings();
/* Uses timezone and date format specified in CMS settings to format a Date object or UTC string. */
export function siteFormatTimeString(utcTimestamp: string | Date): string {
  const timezoned = moment.utc(utcTimestamp).utcOffset(dateSettings.timezone.offset * 60);
  return dateI18n(dateSettings.formats.datetime, timezoned);
}

export async function saveAddressToProfile(address: EthAddress) {
  await apiRequest({
    method: "POST",
    path: apiNamespace + "users/me",
    data: {
      [userMetaKeys.WALLET_ADDRESS]: address,
    },
  });

  const civilDispatch = dispatch("civil/blockchain");
  if (civilDispatch) {
    civilDispatch.setWpUserAddress(address);
  }
}

export function updatePostMeta(metaUpdates: Object) {
  const unsavedMeta = getPostEdits().meta;
  editPost({
    meta: { ...unsavedMeta, ...metaUpdates }
  });
}
