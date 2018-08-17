const { withSelect, withDispatch } = window.wp.data;
const { compose } = window.wp.element;
import { ApprovedRevision } from "@joincivil/core";
import { recoverSignerPersonal, prepareUserFriendlyNewsroomMessage } from "@joincivil/utils";
import { createSignatureData, updatePostMeta } from "../util";
import { postMetaKeys } from "../constants";
import { SignatureData } from "./store/interfaces";
import { BlockchainSignPanelProps, BlockchainSignPanelComponent } from "./components/BlockchainSignPanel";

export type signatureStatusType = "unsigned" | "valid" | "invalid";

const BlockchainSignPanel = compose([
  withSelect(
    (selectStore: any, ownProps: Partial<BlockchainSignPanelProps>): Partial<BlockchainSignPanelProps> => {
      const {
        isEditedPostDirty,
        isCleanNewPost,
        isSavingPost,
      } = selectStore("core/editor");
      const {
        getCurrrentUserId,
        getCurrentUserId,
        getWeb3ProviderAddress,
        getCurrentWpUserAddress,
        getSignatures,
        isValidSignature,
        isWpEditor,
        getLatestRevisionJSON,
        getPostAuthors,
        currentUserIsPostAuthor,
      } = selectStore("civil/blockchain");

      const currentUserId = getCurrentUserId();
      const signatures = getSignatures();

      const isSignButtonDisabled = (): boolean => {
        if (!getLatestRevisionJSON()) {
          // Validity can't be checked, wait til revision JSON loaded
          return true;
        }

        const wpUserAddress = getCurrentWpUserAddress();
        const web3Address = getWeb3ProviderAddress();
        if (!wpUserAddress || !web3Address || wpUserAddress !== web3Address) {
          return true;
        }

        const ownSignature = signatures[currentUserId];
        if (ownSignature && isValidSignature(ownSignature)) {
          // No need to re-sign if signed and valid
          return true;
        } else {
          // Otherwise either they've previously signed but it's invalid, or they've never signed.
          // We only want to allow them to sign if the post has been saved to DB, so that we can fetch content hash from server in order to create sign message
          return isEditedPostDirty() || isCleanNewPost();
        }
      };

      return {
        currentUserId,
        isWpEditor: isWpEditor(),
        signatures,
        signDisabled: isSignButtonDisabled(),
        isValidSignature,
        isDirty: isEditedPostDirty(),
        isSavingPost: isSavingPost(),
        latestRevisionJson: getLatestRevisionJSON(),
        postAuthors: getPostAuthors(),
        currentUserIsPostAuthor: currentUserIsPostAuthor(),
      };
    },
  ),

  withDispatch(
    (dispatch: any, ownProps: BlockchainSignPanelProps): Partial<BlockchainSignPanelProps> => {
      const { savePost } = dispatch("core/editor");
      const { updateSignatures } = dispatch("civil/blockchain");
      const { currentUserId, signatures } = ownProps;

      const signArticle = async (cb?: () => void): Promise<void> => {
        const signature = await createSignatureData(ownProps.latestRevisionJson);
        const newSignatures = { ...signatures, [currentUserId]: signature };
        updatePostMeta({ [postMetaKeys.SIGNATURES]: JSON.stringify(newSignatures) });
        savePost();
        dispatch(updateSignatures(newSignatures));
        cb && cb();
      };

      return {
        signArticle,
      };
    },
  ),
])(BlockchainSignPanelComponent);

export default BlockchainSignPanel;
