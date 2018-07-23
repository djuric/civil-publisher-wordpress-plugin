import * as React from "react";
import * as ReactDom from "react-dom";
import { CivilNavBarButtons, CivilNavBarButtonsProps } from "./CivilNavBarButtons";
const { withDispatch, withSelect } = window.wp.data;
const { compose } = window.wp.element;

export class CivilSidebarToggleComponent extends React.Component<CivilNavBarButtonsProps> {
    public divRef: HTMLDivElement | null;
    public el: HTMLDivElement;

    constructor(props: any) {
      super(props);
      this.divRef = null;
      this.el = document.createElement("div");
    }

    public componentDidMount(): void {
      if (this.divRef) {
        const buttonContainer = this.divRef.parentElement;
        buttonContainer!.style.height = "0px";
        buttonContainer!.style.width = "0px";
        buttonContainer!.style.padding = "0";
        buttonContainer!.parentNode!.insertBefore(this.el, buttonContainer!.nextSibling)
      }
    }

    public render(): JSX.Element {
      console.log({props: this.props, state: this.state});
      const portal = ReactDom.createPortal(<CivilNavBarButtons {...this.props}/>, this.el);
      return <>
        {portal}
        <div ref={el => this.divRef = el}></div>
      </>;
    }
};


export const CivilSidebarWithComposed = compose([
    withSelect((selectStore: any): CivilNavBarButtonsProps => {
        const { isPluginSidebarOpened } = selectStore("core/edit-post");
        const {
            getTxHash,
            getLastPublishedRevision,
            getCurrentIsVersionPublished,
        } = selectStore("civil/blockchain");

        return {
            isClosed: isPluginSidebarOpened(),
            txHash: getTxHash(),
            lastpublishedRevision: getLastPublishedRevision(),
            currentIsVersionPublished: getCurrentIsVersionPublished(),
        }
    }),
  ])(CivilSidebarToggleComponent);
