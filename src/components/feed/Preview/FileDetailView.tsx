import React, { Fragment, ReactElement, useCallback } from "react";
import * as dicomParser from "dicom-parser";
import {
  Label,
  Text,
  ApplicationLauncher,
  ApplicationLauncherItem,
  DropdownPosition,
  Tooltip,
} from "@patternfly/react-core";
import { ErrorBoundary } from "react-error-boundary";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FeedFile } from "@fnndsc/chrisapi";
import {
  MdZoomIn,
  MdOutlinePanTool,
  MdRotateRight,
  MdSettingsBrightness,
  MdInfo,
  MdDraw,
} from "react-icons/md";
import { RxReset } from "react-icons/rx";
import {
  AiFillInfoCircle,
  AiOutlineMenuUnfold,
  AiOutlineZoomIn,
} from "react-icons/ai";
import { getFileExtension } from "../../../api/models/file-explorer.model";
import {
  IFileBlob,
  fileViewerMap,
} from "../../../api/models/file-viewer.model";
import { SpinContainer } from "../../common/loading/LoadingContent";
import {
  ButtonContainer,
  TagInfoModal,
} from "../../detailedView/displays/DicomViewer/utils/helpers";
import { dumpDataSet } from "../../detailedView/displays/DicomViewer/utils";

const ViewerDisplay = React.lazy(() => import("./displays/ViewerDisplay"));

interface AllProps {
  selectedFile?: FeedFile;
  isDicom?: boolean;
  preview: "large" | "small";
  handleNext?: () => void;
  handlePrevious?: () => void;
  gallery?: boolean;
}

export interface ActionState {
  [key: string]: boolean;
}

function getInitialState() {
  return {
    blob: undefined,
    file: undefined,
    fileType: "",
  };
}

const FileDetailView = (props: AllProps) => {
  const [fileState, setFileState] = React.useState<IFileBlob>(getInitialState);
  const [tagInfo, setTagInfo] = React.useState<any>();
  const [actionState, setActionState] = React.useState<ActionState>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleKeyboardEvents = (event: any) => {
    switch (event.keyCode) {
      case 39: {
        event.preventDefault();
        props.handleNext && props.handleNext();
        break;
      }

      case 37: {
        event.preventDefault();
        props.handlePrevious && props.handlePrevious();
        break;
      }

      default:
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyboardEvents);

    return () => {
      window.removeEventListener("keydown", handleKeyboardEvents);
    };
  });

  const displayTagInfo = useCallback((result: any) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        if (reader.result) {
          //@ts-ignore
          const byteArray = new Uint8Array(reader.result);
          //@ts-ignore
          const testOutput: any[] = [];
          const output: any[] = [];
          const dataSet = dicomParser.parseDicom(byteArray);
          dumpDataSet(dataSet, output, testOutput);
          const merged = Object.assign({}, ...testOutput);
          setTagInfo(merged);
        }
      } catch (error) {
        console.log("Error", error);
      }
    };

    if (result) {
      reader.readAsArrayBuffer(result);
    }
  }, []);

  const handleEvents = (action: string) => {
    if (action === "TagInfo") {
      displayTagInfo(fileState.blob);
    }
    const currentAction = actionState[action];
    setActionState({
      [action]: !currentAction,
    });
  };
  const { selectedFile, preview } = props;
  const { fileType } = fileState;

  const fetchData = React.useCallback(async () => {
    if (selectedFile) {
      const fileName = selectedFile.data.fname,
        fileType = getFileExtension(fileName);

      try {
        setLoading(true);
        const blob = await selectedFile.getFileBlob();
        setFileState((fileState) => {
          return {
            ...fileState,
            blob,
            file: selectedFile,
            fileType,
          };
        });
        setLoading(false);
      } catch (error: any) {
        const errorMessage = error.response || error.message;
        setLoading(false);
        setError(errorMessage);
      }
    }
  }, [selectedFile]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  let viewerName = "";

  if (!fileViewerMap[fileType]) {
    viewerName = "TextDisplay";
  } else {
    viewerName = fileViewerMap[fileType];
  }

  const handleModalToggle = (actionName: string, value: boolean) => {
    setActionState({
      ...actionState,
      [actionName]: value,
    });
  };

  const previewType = preview === "large" ? "large-preview" : "small-preview";

  const errorComponent = (error?: any) => (
    <span>
      <Label icon={<AiFillInfoCircle />} color="red" href="#filled">
        <Text component="p">
          {error
            ? error
            : "Oh snap ! Looks like there was an error. Please refresh the browser or try again."}
        </Text>
      </Label>
    </span>
  );

  return (
    <Fragment>
      <React.Suspense
        fallback={
          <SpinContainer title="Please wait as the preview is being fetched" />
        }
      >
        <ErrorBoundary fallback={errorComponent()}>
          <div className={previewType}>
            {props.gallery && (
              <div
                style={{
                  width: "100%",
                  zIndex: 999,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <FaChevronLeft
                  onClick={props.handlePrevious}
                  style={{
                    fontSize: "1.35rem",
                  }}
                />
                <FaChevronRight
                  onClick={props.handleNext}
                  style={{
                    fontSize: "1.35rem",
                  }}
                />
              </div>
            )}

            {previewType === "large-preview" && (
              <DicomHeader
                viewerName={viewerName}
                handleEvents={handleEvents}
              />
            )}

            {loading && (
              <SpinContainer
                title="Please wait as the preview is being fetched"
                fontColor="white"
              />
            )}

            {error && <span style={{ color: "red" }}>{error}</span>}

            {
              <ViewerDisplay
                preview={preview}
                viewerName={viewerName}
                fileItem={fileState}
                actionState={actionState}
              />
            }
          </div>
          <TagInfoModal
            handleModalToggle={handleModalToggle}
            isModalOpen={actionState["TagInfo"]}
            output={tagInfo}
          />
        </ErrorBoundary>
      </React.Suspense>
    </Fragment>
  );
};

export default FileDetailView;

const actions = [
  {
    name: "Zoom",
    icon: <AiOutlineZoomIn />,
  },
  {
    name: "Pan",
    icon: <MdOutlinePanTool />,
  },
  {
    name: "Magnify",
    icon: <MdZoomIn />,
  },
  {
    name: "Rotate",
    icon: <MdRotateRight />,
  },
  {
    name: "Wwwc",
    icon: <MdSettingsBrightness />,
  },
  {
    name: "Reset View",
    icon: <RxReset />,
  },
  {
    name: "Length",
    icon: <MdDraw />,
  },

  {
    name: "TagInfo",
    icon: <MdInfo />,
  },
];

const getViewerSpecificActions: {
  [key: string]: { name: string; icon: ReactElement }[];
} = {
  DcmDisplay: actions,
  NiftiDisplay: actions,
  ImageDisplay: actions,
};

export const DicomHeader = ({
  handleEvents,
  viewerName,
}: {
  viewerName: string;
  handleEvents: (action: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const specificActions = getViewerSpecificActions[viewerName];

  const appLauncherItems =
    specificActions && specificActions.length > 0
      ? specificActions.map((action) => {
          return (
            <ApplicationLauncherItem
              component={
                <ButtonContainer
                  action={action.name}
                  icon={action.icon}
                  handleEvents={handleEvents}
                />
              }
              key={action.name}
            />
          );
        })
      : [
          <span style={{ color: "white" }} key={"test"}>
            No tools
          </span>,
        ];

  return (
    <ApplicationLauncher
      toggleIcon={
        <Tooltip
          position="left"
          content={<span>Tools for the selected file</span>}
        >
          <AiOutlineMenuUnfold
            style={{
              width: "24px",
              height: "24px",
              color: "white",
            }}
          />
        </Tooltip>
      }
      style={{
        position: "absolute",
        right: "var(--pf-global--spacer--md)",
        marginRight: "-0.6rem",
        zIndex: "9999",
        color: "black",
        marginBottom: "0.5rem",
      }}
      onToggle={() => setIsOpen(!isOpen)}
      items={appLauncherItems}
      isOpen={isOpen}
      position={DropdownPosition.right}
    />
  );
};
