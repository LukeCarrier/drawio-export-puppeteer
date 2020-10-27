// Exposed for testing
const TRANSPARENT_COLORS = ["", "none"];
const TRANSPARENT_FORMATS = ["png", "svg"];

const BORDER = 2;

const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>';
const SVG_DOCTYPE =
  '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

function initializeGraph(document) {
  document.body.innerHTML = "";
  const container = document.createElement("div");
  container.id = "graph";
  container.style.width = "100%";
  container.style.height = "100%";
  document.body.appendChild(container);

  const graph = new Graph(container);
  graph.setEnabled(false);
  graph.foldingEnabled = false;

  return { container, graph };
}

function monkeypatchGraph(graph) {
  const graphGetLinkForCell = graph.getLinkForCell;
  graph.getLinkForCell = function (cell) {
    const link = graphGetLinkForCell.apply(this, arguments);
    if (link != null && this.isCustomLink(link)) {
      link = null;
    }

    return link;
  };

  const cellRendererRedrawLabelShape = graph.cellRenderer.redrawLabelShape;
  graph.cellRenderer.redrawLabelShape = function (shape) {
    cellRendererRedrawLabelShape.apply(this, arguments);
    if (shape.node != null) {
      const links = shape.node.getElementsByTagName("a");

      for (const i = 0; i < links.length; i++) {
        const href = links[i].getAttribute("href");
        if (href != null && graph.isCustomLink(href)) {
          links[i].setAttribute("href", "#");
        }
      }
    }
  };
}

function parseInput(input) {
  const doc = mxUtils.parseXml(input);

  const node = Editor.extractGraphModel(doc.documentElement, true);
  const xmlDoc = node.ownerDocument;

  if (xmlDoc.documentElement.nodeName !== "mxfile") {
    throw new Error(
      `Unsupported root node name ${xmlDoc.documentElement.nodeName}`
    );
  }

  return { node, xmlDoc };
}

function decodeDiagram(graph, xmlDoc) {
  const codec = new mxCodec(xmlDoc);
  const model = graph.getModel();
  codec.decode(xmlDoc.documentElement, model);
}

function normalizeBackgroundColor(xmlDoc, format) {
  let backgroundColor = xmlDoc.documentElement.getAttribute("background");

  // Handle some different values that really mean transparent
  if (TRANSPARENT_COLORS.includes(backgroundColor)) {
    backgroundColor = null;
  }

  // Fall back to white for formats that don't support transparency
  if (!TRANSPARENT_FORMATS.includes(format)) {
    backgroundColor = "#ffffff";
  }

  return backgroundColor;
}

function scaleGraph(graph) {
  const bounds = graph.getGraphBounds();
  let scale = 1;

  graph.view.scaleAndTranslate(
    scale,
    -Math.floor(bounds.x),
    -Math.floor(bounds.y)
  );

  return { bounds, scale };
}

function renderPage(document, xmlDoc, format) {
  const { container, graph } = initializeGraph(document);
  monkeypatchGraph(graph);
  decodeDiagram(graph, xmlDoc);

  document.body.style.backgroundColor = normalizeBackgroundColor(
    xmlDoc,
    format
  );
  const { bounds, scale } = scaleGraph(graph);

  return { bounds, scale, graph };
}

function writeResultInfo(document, pageCount, pageId, bounds, scale) {
  const indicator = document.createElement("div");
  indicator.id = "result-info";
  indicator.style.display = "none";

  indicator.setAttribute("data-page-count", pageCount);
  indicator.setAttribute("data-page-id", pageId);

  indicator.setAttribute("data-bounds-x", bounds.x);
  indicator.setAttribute("data-bounds-y", bounds.y);
  indicator.setAttribute("data-bounds-width", bounds.width);
  indicator.setAttribute("data-bounds-height", bounds.height);

  indicator.setAttribute("data-scale", scale);

  document.body.appendChild(indicator);
}

// Exposed for Puppeteer
function render(input, pageIndex, format) {
  console.debug("Rendering page", pageIndex, "as", format);

  const { xmlDoc: rootXmlDoc } = parseInput(input);
  const diagrams = rootXmlDoc.documentElement.getElementsByTagName("diagram");

  const diagramNode = Editor.parseDiagramNode(diagrams[pageIndex]);
  const diagramXmlDoc = diagramNode.ownerDocument;
  const diagramId = diagrams[pageIndex].getAttribute("id");

  const { bounds, scale, graph } = renderPage(document, diagramXmlDoc, format);
  writeResultInfo(document, diagrams.length, diagramId, bounds, scale);

  return graph;
}

// Exposed for Puppeteer
function exportSvg(graph, scale) {
  const background = graph.background;
  if (background == mxConstants.NONE) {
    background = null;
  }

  const svgRoot = graph.getSvg(
    background,
    scale,
    BORDER,
    false,
    null,
    true,
    null,
    null,
    null
  );
  const svg = XML_PROLOG + SVG_DOCTYPE + mxUtils.getXml(svgRoot);
  return svg;
}
