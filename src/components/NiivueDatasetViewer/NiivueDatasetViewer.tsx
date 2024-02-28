import React, { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { useDispatch } from "react-redux";
import { PageSection } from "@patternfly/react-core";
import WrapperConnect from "../Wrapper";
import ChrisAPIClient from "../../api/chrisapiclient";
import { setIsNavOpen, setSidebarActive } from "../../store/ui/actions";

import { ChNVROptions } from "./models";
import { DEFAULT_OPTIONS } from "./defaults";
import HeaderOptionBar from "./components/HeaderOptionBar";
import SizedNiivueCanvas, { CrosshairLocation } from "../SizedNiivueCanvas";
import { Problem, VisualDataset } from "./types";
import {
  DatasetFilesClient,
  DatasetPreClient,
  getDataset,
  getPreClient,
} from "./client";
import { flexRowSpaceBetween, hideOnMobile } from "./cssUtils";
import { FpClient } from "../../api/fp/chrisapi";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import DatasetPageDrawer from "./components/Drawer";
import {
  InfoForPageHeader,
  ControlPanel,
  DatasetDescriptionText,
} from "./content";
import { parsePluginInstanceId } from "./client/helpers";
import { getFeedOf } from "./client/getDataset";
import { Feed } from "@fnndsc/chrisapi";
import { DatasetFileState, DatasetVolume, files2states } from "./statefulTypes";
import { notNullSetState } from "./helpers";
import styles from "./NiivueDatasetViewer.module.css";
import { css } from "@patternfly/react-styles";
import BackgroundColor from "@patternfly/react-styles/css/utilities/BackgroundColor/BackgroundColor";
import Spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

/**
 * The "Niivue Datasets Viewer" is a view of ChRIS_ui which implements a
 * visualizer component for feeds containing datasets conforming to the
 * "visual dataset" specification described here:
 *
 * https://chrisproject.org/docs/visual_dataset
 *
 * It is a wrapper around Niivue, providing controls for Niivue's settings
 * and logic for feeding data from CUBE to Niivue.
 *
 * The primary purpose of the "Visual Datasets Viewer" is to power
 * http://fetalmri.org. Nonetheless, the "Visual Datasets Browser"
 * is generally useful for other datasets of 3D medical images.
 */
const NiivueDatasetViewer: React.FC<{ plinstId: string }> = ({ plinstId }) => {
  const dispatch = useDispatch();
  const [dataset, setDataset] = useState<VisualDataset | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  /**
   * Dataset README.txt file content.
   *
   * - `null` represents README not loaded
   * - empty represents README is empty OR dataset does not have a README
   */
  const [readme, setReadme] = useState<string | null>(null);
  /**
   * Viewable files of a dataset.
   */
  const [fileStates, setFileStates] =
    useState<ReadonlyArray<DatasetFileState> | null>(null);
  /**
   * All the tag keys and all of their possible values for a dataset.
   */
  const [tagsDictionary, setTagsDictionary] = useState<{
    [key: string]: string[];
  } | null>(null);

  const [firstRunFiles, setFirstRunFiles] = useState<number[] | null>(null);

  const [nvOptions, setNvOptions] = useImmer<ChNVROptions>(DEFAULT_OPTIONS);
  const [nvSize, setNvSize] = useState(10);
  const [sizeIsScaling, setSizeIsScaling] = useState(false);
  const [crosshairLocation, setCrosshairLocation] = useState<CrosshairLocation>(
    { string: "" },
  );

  const client = new FpClient(ChrisAPIClient.getClient());

  const [problems, setProblems] = useState<Problem[]>([]);
  const pushProblem = (p: Problem) => setProblems([...problems, p]);
  const pushProblems = (p: Problem[]) => setProblems(problems.concat(p));

  // EFFECTS
  // --------------------------------------------------------------------------------

  // when the web app is ready, hide the sidebar and set the page title.
  React.useEffect(() => {
    document.title = "Volume View";
    dispatch(setIsNavOpen(false));
    dispatch(
      setSidebarActive({
        activeItem: "dataset",
      }),
    );
  }, [dispatch]);

  // on first load, get the dataset's plugin instances.
  useEffect(() => {
    const task = pipe(
      plinstId,
      parsePluginInstanceId,
      TE.fromEither,
      TE.flatMap((id) => getDataset(client, id)),
      TE.match(pushProblem, setDataset),
    );
    task();
  }, [plinstId]);

  const fetchAndSetReadme = (preClient: DatasetPreClient) => {
    const task = pipe(
      preClient.getReadme(),
      // if dataset does not have a README, set README as empty
      O.getOrElse(() => TE.of("")),
      TE.match(pushProblem, setReadme),
    );
    task();
    return preClient;
  };

  const tapSetTagsDictionary = (filesClient: DatasetFilesClient) => {
    setTagsDictionary(filesClient.tagsDictionary);
    return filesClient;
  };

  const tapSetFirstRunFiles = (filesClient: DatasetFilesClient) => {
    setFirstRunFiles(filesClient.firstRunFiles);
    return filesClient;
  };

  // when a dataset is selected, get its feed, readme, tags dictionary, and files
  useEffect(() => {
    if (dataset === null) {
      setReadme(null);
      setFileStates(null);
      setTagsDictionary(null);
      return;
    }
    const preclientTask = pipe(
      getPreClient(client, dataset),
      TE.map(fetchAndSetReadme),
      TE.flatMap((preClient) => preClient.getFilesClient()),
      TE.map(tapSetTagsDictionary),
      TE.map(tapSetFirstRunFiles),
      TE.map((filesClient) => filesClient.listFiles()),
      TE.map(files2states),
      TE.match(pushProblem, setFileStates),
    );
    const feedTask = pipe(
      getFeedOf(dataset.indexPlinst),
      TE.match(pushProblem, setFeed),
    );
    preclientTask();
    feedTask();
  }, [dataset]);

  // ELEMENT
  // --------------------------------------------------------------------------------

  const controlPanel = (
    <ControlPanel
      problems={problems}
      pushProblems={pushProblems}
      fileStates={fileStates}
      setFileStates={notNullSetState(setFileStates)}
      firstRunFiles={firstRunFiles}
    />
  );

  const datasetDescriptionText = (
    <DatasetDescriptionText feed={feed} readme={readme} />
  );

  const volumes =
    fileStates === null
      ? []
      : fileStates
          .map(({ volume }) => volume)
          .filter(
            (v): v is DatasetVolume => v !== null && typeof v === "object",
          )
          .map(({ state }) => state);

  return (
    <WrapperConnect>
      <PageSection>
        <div className={hideOnMobile}>
          <div className={flexRowSpaceBetween}>
            <InfoForPageHeader />
            <HeaderOptionBar options={nvOptions} setOptions={setNvOptions} />
          </div>
        </div>
      </PageSection>

      <PageSection isFilled padding={{ default: "noPadding" }}>
        <DatasetPageDrawer head={datasetDescriptionText} side={controlPanel}>
          <SizedNiivueCanvas
            size={nvSize}
            isScaling={sizeIsScaling}
            onLocationChange={setCrosshairLocation}
            options={nvOptions}
            volumes={volumes}
          />
          <div
            className={css(
              styles.bottomFooter,
              BackgroundColor.backgroundColor_200,
              Spacing.pSm,
            )}
          >
            Location: {crosshairLocation.string}
          </div>
        </DatasetPageDrawer>
      </PageSection>
    </WrapperConnect>
  );
};

export default NiivueDatasetViewer;