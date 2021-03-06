import React from "react";
import { connect } from "react-redux";
import ForceGraph3D, {
  NodeObject,
  ForceGraphMethods,
} from "react-force-graph-3d";
import { PluginInstancePayload } from "../../../store/pluginInstance/types";
import { ApplicationState } from "../../../store/root/applicationState";
import TreeModel from "../../../api/models/tree.model";
import { PluginInstance } from "@fnndsc/chrisapi";
import { ErrorBoundary } from "react-error-boundary";
import { Text, Button } from "@patternfly/react-core";
import useSize from './useSize';
import "./FeedTree.scss";

interface IFeedProps {
  pluginInstances: PluginInstancePayload;
  selectedPlugin?: PluginInstance;
  onNodeClick: (node: PluginInstance) => void;
  isSidePanelExpanded: boolean;
  isBottomPanelExpanded: boolean;
  onExpand: (panel: string) => void;
}


const FeedGraph = (props: IFeedProps) => {
  const {
    pluginInstances,
    selectedPlugin,
    onNodeClick,
    isSidePanelExpanded,
    isBottomPanelExpanded,
    onExpand,
  } = props;
  const { data: instances } = pluginInstances;
  const graphRef = React.useRef<HTMLDivElement | null>(null);
  const fgRef = React.useRef<ForceGraphMethods | undefined>();

  const size = useSize(graphRef);

  const [graphData, setGraphData] = React.useState();

  const handleNodeClick = (node: NodeObject) => {
    const distance = 40;
    if (node && node.x && node.y && node.z && fgRef.current) {
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      fgRef.current.cameraPosition(
        {
          x: node.x * distRatio,
          y: node.y * distRatio,
          z: node.z * distRatio,
        }, // new position
        //@ts-ignore
        node, // lookAt ({ x, y, z })
        3000 // ms transition duration
      );
    }

    //@ts-ignore
    onNodeClick(node.item);
  };

  React.useEffect(() => {
    if (instances && instances.length > 0) {
      const tree = new TreeModel(instances);

      //@ts-ignore
      setGraphData(tree.treeChart);
    }
  }, [instances]);

  return (
    <div className="feed-tree" ref={graphRef}>
      {size && graphData ? (
        <ErrorBoundary
          fallback={
            <Text>
              If you see this message, it means that the graph modules
              weren&apos;t loaded. Please refresh your browser.
            </Text>
          }
        >
          {!isSidePanelExpanded && (
            <div className="feed-tree__container--panelToggle node-graph-panel">
              <div className="feed-tree__orientation">
                <Button type="button" onClick={() => onExpand("side_panel")}>
                  Node Panel
                </Button>
              </div>
            </div>
          )}
          <ForceGraph3D
            ref={fgRef}
            //@ts-ignore
            height={size.height || 500}
            //@ts-ignore
            width={size.width || 500}
            graphData={graphData}
            nodeAutoColorBy={(d: any) => {
              if (selectedPlugin && d.item.data.id === selectedPlugin.data.id) {
                return "#fff";
              }
              return d.group;
            }}
            onNodeClick={handleNodeClick}
            nodeLabel={(d: any) => {
              return `${d.item.data.title || d.item.data.plugin_name}`;
            }}
            linkWidth={2}
          />
          {!isBottomPanelExpanded && (
            <div className="feed-tree__container--panelToggle graph">
              <div className="feed-tree__orientation">
                <Button type="button" onClick={() => onExpand("bottom_panel")}>
                  Feed Browser
                </Button>
              </div>
            </div>
          )}
        </ErrorBoundary>
      ) : (
        <Text>Fetching the Graph....</Text>
      )}
    </div>
  );
};

const mapStateToProps = (state: ApplicationState) => ({
  pluginInstances: state.instance.pluginInstances,
  selectedPlugin: state.instance.selectedPlugin,
});

export default connect(mapStateToProps, {})(FeedGraph);
