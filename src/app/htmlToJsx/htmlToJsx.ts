/**
 * This is a copy paste of `htmltojsx/src/htmltojsx.js`
 * That lib tries to support both node / cli / browser
 * So I just removed the `node` stuff from this file instead of taking too many depdencies
 */
'use strict';

/**
 * This is a very simple HTML to JSX converter. It turns out that browsers
 * have good HTML parsers (who would have thought?) so we utilise this by
 * inserting the HTML into a temporary DOM node, and then do a breadth-first
 * traversal of the resulting DOM tree.
 */

// https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
var NODE_TYPE = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8
};

var ATTRIBUTE_MAPPING = {
  'for': 'htmlFor',
  'class': 'className'
};

var ELEMENT_ATTRIBUTE_MAPPING = {
  'input': {
    'checked': 'defaultChecked',
    'value': 'defaultValue'
  }
};

var HTMLDOMPropertyConfig = require('react/lib/HTMLDOMPropertyConfig');

// Populate property map with ReactJS's attribute and property mappings
// TODO handle/use .Properties value eg: MUST_USE_PROPERTY is not HTML attr
for (var propname in HTMLDOMPropertyConfig.Properties) {
  if (!HTMLDOMPropertyConfig.Properties.hasOwnProperty(propname)) {
    continue;
  }

  var mapFrom = HTMLDOMPropertyConfig.DOMAttributeNames[propname] || propname.toLowerCase();

  if (!ATTRIBUTE_MAPPING[mapFrom])
    ATTRIBUTE_MAPPING[mapFrom] = propname;
}

/**
 * Repeats a string a certain number of times.
 * Also: the future is bright and consists of native string repetition:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
 *
 * @param {string} string  String to repeat
 * @param {number} times   Number of times to repeat string. Integer.
 * @see http://jsperf.com/string-repeater/2
 */
function repeatString(string, times) {
  if (times === 1) {
    return string;
  }
  if (times < 0) { throw new Error(); }
  var repeated = '';
  while (times) {
    if (times & 1) {
      repeated += string;
    }
    if (times >>= 1) {
      string += string;
    }
  }
  return repeated;
}

/**
 * Determine if the string ends with the specified substring.
 *
 * @param {string} haystack String to search in
 * @param {string} needle   String to search for
 * @return {boolean}
 */
function endsWith(haystack, needle) {
  return haystack.slice(-needle.length) === needle;
}

/**
 * Trim the specified substring off the string. If the string does not end
 * with the specified substring, this is a no-op.
 *
 * @param {string} haystack String to search in
 * @param {string} needle   String to search for
 * @return {string}
 */
function trimEnd(haystack, needle) {
  return endsWith(haystack, needle)
    ? haystack.slice(0, -needle.length)
    : haystack;
}

/**
 * Convert a hyphenated string to camelCase.
 */
function hyphenToCamelCase(string) {
  return string.replace(/-(.)/g, function(match, chr) {
    return chr.toUpperCase();
  });
}

/**
 * Determines if the specified string consists entirely of whitespace.
 */
function isEmpty(string) {
   return !/[^\s]/.test(string);
}

/**
 * Determines if the CSS value can be converted from a
 * 'px' suffixed string to a numeric value
 *
 * @param {string} value CSS property value
 * @return {boolean}
 */
function isConvertiblePixelValue(value) {
  return /^\d+px$/.test(value);
}

/**
 * Determines if the specified string consists entirely of numeric characters.
 */
function isNumeric(input) {
  return input !== undefined
    && input !== null
    && (typeof input === 'number' || parseInt(input, 10) == input);
}

const createElement = function(tag) {
  return document.createElement(tag);
};

var tempEl = createElement('div');
/**
 * Escapes special characters by converting them to their escaped equivalent
 * (eg. "<" to "&lt;"). Only escapes characters that absolutely must be escaped.
 *
 * @param {string} value
 * @return {string}
 */
function escapeSpecialChars(value) {
  // Uses this One Weird Trick to escape text - Raw text inserted as textContent
  // will have its escaped version in innerHTML.
  tempEl.textContent = value;
  return tempEl.innerHTML;
}

export type Config = {
    createClass?: boolean;
    outputClassName?: string;
    /** as a string e.g. '    ' or '\t' */
    indent?: string;
}

export class HTMLtoJSX {
    private config: Config;
    private output: string;
    private level: number;
    private _inPreTag: boolean;


    constructor(config:Config) {
      this.config = config || {};

      if (this.config.createClass === undefined) {
        this.config.createClass = true;
      }
      if (!this.config.indent) {
        this.config.indent = '  ';
      }
    }

  /**
   * Reset the internal state of the converter
   */
  reset = () => {
    this.output = '';
    this.level = 0;
    this._inPreTag = false;
  }
  /**
   * Main entry point to the converter. Given the specified HTML, returns a
   * JSX object representing it.
   * @param {string} html HTML to convert
   * @return {string} JSX
   */
  convert = (html) => {
    this.reset();

    var containerEl = createElement('div');
    containerEl.innerHTML = '\n' + this._cleanInput(html) + '\n';

    if (this.config.createClass) {
      if (this.config.outputClassName) {
        this.output = 'var ' + this.config.outputClassName + ' = React.createClass({\n';
      } else {
        this.output = 'React.createClass({\n';
      }
      this.output += this.config.indent + 'render: function() {' + "\n";
      this.output += this.config.indent + this.config.indent + 'return (\n';
    }

    if (this._onlyOneTopLevel(containerEl)) {
      // Only one top-level element, the component can return it directly
      // No need to actually visit the container element
      this._traverse(containerEl);
    } else {
      // More than one top-level element, need to wrap the whole thing in a
      // container.
      this.output += this.config.indent + this.config.indent + this.config.indent;
      this.level++;
      this._visit(containerEl);
    }
    this.output = this.output.trim() + '\n';
    if (this.config.createClass) {
      this.output += this.config.indent + this.config.indent + ');\n';
      this.output += this.config.indent + '}\n';
      this.output += '});';
    }
    return this.output;
  }

  /**
   * Cleans up the specified HTML so it's in a format acceptable for
   * converting.
   *
   * @param {string} html HTML to clean
   * @return {string} Cleaned HTML
   */
  _cleanInput = (html) => {
    // Remove unnecessary whitespace
    html = html.trim();
    // Ugly method to strip script tags. They can wreak havoc on the DOM nodes
    // so let's not even put them in the DOM.
    html = html.replace(/<script([\s\S]*?)<\/script>/g, '');
    return html;
  }

  /**
   * Determines if there's only one top-level node in the DOM tree. That is,
   * all the HTML is wrapped by a single HTML tag.
   *
   * @param {DOMElement} containerEl Container element
   * @return {boolean}
   */
  _onlyOneTopLevel = (containerEl) => {
    // Only a single child element
    if (
      containerEl.childNodes.length === 1
      && containerEl.childNodes[0].nodeType === NODE_TYPE.ELEMENT
    ) {
      return true;
    }
    // Only one element, and all other children are whitespace
    var foundElement = false;
    for (var i = 0, count = containerEl.childNodes.length; i < count; i++) {
      var child = containerEl.childNodes[i];
      if (child.nodeType === NODE_TYPE.ELEMENT) {
        if (foundElement) {
          // Encountered an element after already encountering another one
          // Therefore, more than one element at root level
          return false;
        } else {
          foundElement = true;
        }
      } else if (child.nodeType === NODE_TYPE.TEXT && !isEmpty(child.textContent)) {
        // Contains text content
        return false;
      }
    }
    return true;
  }

  /**
   * Gets a newline followed by the correct indentation for the current
   * nesting level
   *
   * @return {string}
   */
  _getIndentedNewline = () => {
    return '\n' + repeatString(this.config.indent, this.level + 2);
  }

  /**
   * Handles processing the specified node
   *
   * @param {Node} node
   */
  _visit = (node) => {
    this._beginVisit(node);
    this._traverse(node);
    this._endVisit(node);
  }

  /**
   * Traverses all the children of the specified node
   *
   * @param {Node} node
   */
  _traverse = (node) => {
    this.level++;
    for (var i = 0, count = node.childNodes.length; i < count; i++) {
      this._visit(node.childNodes[i]);
    }
    this.level--;
  }

  /**
   * Handle pre-visit behaviour for the specified node.
   *
   * @param {Node} node
   */
  _beginVisit = (node) => {
    switch (node.nodeType) {
      case NODE_TYPE.ELEMENT:
        this._beginVisitElement(node);
        break;

      case NODE_TYPE.TEXT:
        this._visitText(node);
        break;

      case NODE_TYPE.COMMENT:
        this._visitComment(node);
        break;

      default:
        console.warn('Unrecognised node type: ' + node.nodeType);
    }
  }

  /**
   * Handles post-visit behaviour for the specified node.
   *
   * @param {Node} node
   */
  _endVisit = (node) => {
    switch (node.nodeType) {
      case NODE_TYPE.ELEMENT:
        this._endVisitElement(node);
        break;
      // No ending tags required for these types
      case NODE_TYPE.TEXT:
      case NODE_TYPE.COMMENT:
        break;
    }
  }

  /**
   * Handles pre-visit behaviour for the specified element node
   *
   * @param {DOMElement} node
   */
  _beginVisitElement = (node) => {
    var tagName = node.tagName.toLowerCase();
    var attributes = [];
    for (var i = 0, count = node.attributes.length; i < count; i++) {
      attributes.push(this._getElementAttribute(node, node.attributes[i]));
    }

    if (tagName === 'textarea') {
      // Hax: textareas need their inner text moved to a "defaultValue" attribute.
      attributes.push('defaultValue={' + JSON.stringify(node.value) + '}');
    }
    if (tagName === 'style') {
      // Hax: style tag contents need to be dangerously set due to liberal curly brace usage
      attributes.push('dangerouslySetInnerHTML={{__html: ' + JSON.stringify(node.textContent) + ' }}');
    }
    if (tagName === 'pre') {
      this._inPreTag = true;
    }

    this.output += '<' + tagName;
    if (attributes.length > 0) {
      this.output += ' ' + attributes.join(' ');
    }
    if (!this._isSelfClosing(node)) {
      this.output += '>';
    }
  }

  /**
   * Handles post-visit behaviour for the specified element node
   *
   * @param {Node} node
   */
  _endVisitElement = (node) => {
    var tagName = node.tagName.toLowerCase();
    // De-indent a bit
    // TODO: It's inefficient to do it this way :/
    this.output = trimEnd(this.output, this.config.indent);
    if (this._isSelfClosing(node)) {
      this.output += ' />';
    } else {
      this.output += '</' + node.tagName.toLowerCase() + '>';
    }

    if (tagName === 'pre') {
      this._inPreTag = false;
    }
  }

  /**
   * Determines if this element node should be rendered as a self-closing
   * tag.
   *
   * @param {Node} node
   * @return {boolean}
   */
  _isSelfClosing = (node) => {
    // If it has children, it's not self-closing
    // Exception: All children of a textarea are moved to a "defaultValue" attribute, style attributes are dangerously set.
    return !node.firstChild || node.tagName.toLowerCase() === 'textarea' || node.tagName.toLowerCase() === 'style';
  }

  /**
   * Handles processing of the specified text node
   *
   * @param {TextNode} node
   */
  _visitText = (node) => {
    var parentTag = node.parentNode && node.parentNode.tagName.toLowerCase();
    if (parentTag === 'textarea' || parentTag === 'style') {
      // Ignore text content of textareas and styles, as it will have already been moved
      // to a "defaultValue" attribute and "dangerouslySetInnerHTML" attribute respectively.
      return;
    }

    var text = escapeSpecialChars(node.textContent)

    if (this._inPreTag) {
      // If this text is contained within a <pre>, we need to ensure the JSX
      // whitespace coalescing rules don't eat the whitespace. This means
      // wrapping newlines and sequences of two or more spaces in variables.
      text = text
        .replace(/\r/g, '')
        .replace(/( {2,}|\n|\t|\{|\})/g, function(whitespace) {
          return '{' + JSON.stringify(whitespace) + '}';
        });
    } else {
      // If there's a newline in the text, adjust the indent level
      if (text.indexOf('\n') > -1) {
        text = text.replace(/\n\s*/g, this._getIndentedNewline());
      }
    }
    this.output += text;
  }

  /**
   * Handles processing of the specified text node
   *
   * @param {Text} node
   */
  _visitComment = (node) => {
    this.output += '{/*' + node.textContent.replace('*/', '* /') + '*/}';
  }

  /**
   * Gets a JSX formatted version of the specified attribute from the node
   *
   * @param {DOMElement} node
   * @param {object}     attribute
   * @return {string}
   */
  _getElementAttribute = (node, attribute) => {
    switch (attribute.name) {
      case 'style':
        return this._getStyleAttribute(attribute.value);
      default:
        var tagName = node.tagName.toLowerCase();
        var name =
          (ELEMENT_ATTRIBUTE_MAPPING[tagName] &&
            ELEMENT_ATTRIBUTE_MAPPING[tagName][attribute.name]) ||
          ATTRIBUTE_MAPPING[attribute.name] ||
          attribute.name;
        var result = name;

        // Numeric values should be output as {123} not "123"
        if (isNumeric(attribute.value)) {
          result += '={' + attribute.value + '}';
        } else if (attribute.value.length > 0) {
          result += '="' + attribute.value.replace('"', '&quot;') + '"';
        }
        return result;
    }
  }

  /**
   * Gets a JSX formatted version of the specified element styles
   *
   * @param {string} styles
   * @return {string}
   */
  _getStyleAttribute = (styles) => {
    var jsxStyles = new StyleParser(styles).toJSXString();
    return 'style={{' + jsxStyles + '}}';
  }
};

/**
 * Handles parsing of inline styles
 */
export class StyleParser {
  styles = {};

  /** @param {string} rawStyle Raw style attribute */
  constructor(rawStyle) {
    this.parse(rawStyle);
  };

  /**
   * Parse the specified inline style attribute value
   * @param {string} rawStyle Raw style attribute
   */
  parse = (rawStyle) => {
    rawStyle.split(';').forEach(function(style) {
      style = style.trim();
      var firstColon = style.indexOf(':');
      var key = style.substr(0, firstColon);
      var value = style.substr(firstColon + 1).trim();
      if (key !== '') {
        // Style key should be case insensitive
        key = key.toLowerCase();
        this.styles[key] = value;
      }
    }, this);
  }

  /**
   * Convert the style information represented by this parser into a JSX
   * string
   *
   * @return {string}
   */
  toJSXString = () => {
    var output = [];
    for (var key in this.styles) {
      if (!this.styles.hasOwnProperty(key)) {
        continue;
      }
      output.push(this.toJSXKey(key) + ': ' + this.toJSXValue(this.styles[key]));
    }
    return output.join(', ');
  }

  /**
   * Convert the CSS style key to a JSX style key
   *
   * @param {string} key CSS style key
   * @return {string} JSX style key
   */
  private toJSXKey = (key) => {
    // Don't capitalize -ms- prefix
    if(/^-ms-/.test(key)) {
      key = key.substr(1);
    }
    return hyphenToCamelCase(key);
  }

  /**
   * Convert the CSS style value to a JSX style value
   *
   * @param {string} value CSS style value
   * @return {string} JSX style value
   */
  private toJSXValue = (value) => {
    if (isNumeric(value)) {
      // If numeric, no quotes
      return value;
    } else if (isConvertiblePixelValue(value)) {
      // "500px" -> 500
      return trimEnd(value, 'px');
    } else {
      // Probably a string, wrap it in quotes
      return '\'' + value.replace(/'/g, '"') + '\'';
    }
  }
}
