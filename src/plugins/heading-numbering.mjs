const UNNUMBERED_MARKER = /\s*\{no-number\}\s*$/;

function collectTextNodes(node, result = []) {
  if (node?.type === 'text') result.push(node);
  node?.children?.forEach((child) => collectTextNodes(child, result));
  return result;
}

export default {
  name: 'heading-numbering',
  element: {
    filter: ['h2', 'h3'],
    visit(node, context) {
      const lastText = collectTextNodes(node).at(-1);
      if (!lastText || !UNNUMBERED_MARKER.test(lastText.value)) return;

      context.setProperty(lastText, 'value', lastText.value.replace(UNNUMBERED_MARKER, ''));
      context.setProperty(node, 'dataHeadingNumbered', 'false');
    },
  },
};
