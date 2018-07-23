import { EthAddress, TxHash } from "@joincivil/core";

import { postMetaKeys, userMetaKeys } from "../../constants";
import { SignatureData } from "./interfaces";
import { setCivilContentID, updatePublishedState } from "./actions";
import { revisionJsonSansDate } from "../../util";
import { hashContent } from "@joincivil/utils";

const { dispatch, select } = window.wp.data;

/*
function isResolving(selectorName: string, ...args: any[]): boolean {
  return select("core/data").isResolving(REDUCER_KEY, selectorName, ...args);
}
//*/

export function isNewsroomEditor(state: any): boolean {
  return state.isNewsroomEditor;
}

/** If no id supplied, defaults to current user. */
export function getUserData(state: any, id?: number | "me"): any  {
  if (!id) {
    id = select("civil/blockchain").getCurrentUserId() || "me";
  }
  return state.userData[id!] || {};
}

export function getCurrentUserId(state: any): number {
  return state.currentUserId;
}

/** Returns ETH address associated with logged-in WordPress user (rather than what web3 tells us) */
export function getLoggedInUserAddress(state: any): EthAddress | undefined {
  return select("civil/blockchain").getUserData()[userMetaKeys.WALLET_ADDRESS];
}

export function getUserCapabilities(state: any): { [key: string]: boolean } {
  return select("civil/blockchain").getUserData().capabilities || {};
}

export function getSignatures(state: any): SignatureData {
  if (Object.keys(state.signatures).length) {
    return state.signatures;
  }
  return JSON.parse(getPostMeta()[postMetaKeys.SIGNATURES] || "{}");
}

export function getPublishedStatus(state: any): any {
  return state.publishedStatus;
}

export function getRevisionJSON(state: any, revisionID: string): any {
  return state.revisions[revisionID];
}

function getPostMeta(): any {
  return select("core/editor").getEditedPostAttribute("meta");
}

function isPostPublished(): boolean {
  return select("core/editor").isCurrentPostPublished();
}

export function getCivilContentID(store: any): string | null {
  let { civilContentID } = store;

  // TODO: Hmm, should this be in a resolver?
  if (!civilContentID) {
    civilContentID = getPostMeta()[postMetaKeys.CIVIL_CONTENT_ID];
    dispatch(setCivilContentID(civilContentID));
  }
  return civilContentID;
}

export function isPublishDisabled(state: any): boolean {
  const editorStore = select("core/editor");
  const currentPostLastRevisionId = editorStore.getCurrentPostLastRevisionId();
  const publishedRevisions = getPublishedRevisions(state);
  const latestRevisionPublished = publishedRevisions.length
    ? publishedRevisions[publishedRevisions.length - 1]
    : undefined;

  const isLatestRevisionPublished =
    latestRevisionPublished && latestRevisionPublished.revisionID === currentPostLastRevisionId;

  return (
    !isPostPublished() || editorStore.isCleanNewPost() || editorStore.isEditedPostDirty() || !!isLatestRevisionPublished
  );
}

export function getPublishedRevisions(state: any): any {
  let publishedRevisions = state.publishedStatus;

  if (!publishedRevisions.length) {
    const persistedPublishedRevisions = getPostMeta()[postMetaKeys.PUBLISHED_REVISIONS];
    publishedRevisions = JSON.parse(persistedPublishedRevisions || "[]");
    publishedRevisions = publishedRevisions.map((revision: any) => {
      let newRevision = revision;
      if (typeof revision.published === "string") {
        const published = new Date(revision.published);
        newRevision = { ...revision, published };
      }
      dispatch(updatePublishedState(newRevision));
      return newRevision;
    });
  }

  publishedRevisions = publishedRevisions.map((revision: any) => {
    const data = select("civil/blockchain").getRevisionJSON(revision.revisionID);
    return {
      ...revision,
      data,
    };
  });
  return publishedRevisions;
}

export function isCorrectNetwork(state: any): boolean {
  return state.network.isCorrectNetwork;
}

export function getTxHash(): TxHash | null {
  const txHash = getPostMeta()[postMetaKeys.CIVIL_PUBLISH_TXHASH];
  return txHash;
};

export function getCurrentIsVersionPublished(state: any): boolean {
  const editorStore = select("core/editor");
  const currentPostLastRevisionId = editorStore.getCurrentPostLastRevisionId();
  if (!currentPostLastRevisionId) {
    return false;
  }

  const lastPublishedRevision = getLastPublishedRevision(state);
  if (!lastPublishedRevision) {
    return false;
  }
  const revisionJson = getRevisionJSON(state, currentPostLastRevisionId);

  return revisionJson &&
    hashContent(revisionJsonSansDate(revisionJson)) === lastPublishedRevision.revisionJsonSansDateHash;
}

export function getLastPublishedRevision(state: any): any {
  const publishedRevisions = getPublishedRevisions(state);
  if (publishedRevisions.length) {
    return publishedRevisions[publishedRevisions.length - 1];
  }
}
