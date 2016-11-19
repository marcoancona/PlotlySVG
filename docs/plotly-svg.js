(function() {
  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  window.URL = (window.URL || window.webkitURL);

  var body = document.body;

  var prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg"
  }

  initialize();

  function initialize() {
    var documents = [window.document],
      SVGSource = null;
    iframes = document.querySelectorAll("iframe"),
      objects = document.querySelectorAll("object");

    [].forEach.call(iframes, function(el) {
      try {
        if (el.contentDocument) {
          documents.push(el.contentDocument);
        }
      } catch (err) {
        console.log(err)
      }
    });

    [].forEach.call(objects, function(el) {
      try {
        if (el.contentDocument) {
          documents.push(el.contentDocument);
        }
      } catch (err) {
        console.log(err)
      }
    });

    documents.forEach(function(doc) {
      var styles = getStyles(doc);
      svgSource = getSources(doc, styles);
    })
    if (svgSource) {
      download(svgSource);
    } else {
      alert("The Crowbar couldn’t find any SVG nodes.");
    }
  }

  function getSources(doc, styles) {
    var svgInfo = null,
      svgs = doc.querySelectorAll(".main-svg");

    styles = (styles === undefined) ? "" : styles;

    [].forEach.call(svgs, function(svg, i) {

      if (i > 0) return; // TODO: improve, for now only accept 2 SVGs

      svg.setAttribute("version", "1.1");

      var defsEl = document.createElement("defs");
      svg.insertBefore(defsEl, svg.firstChild); //TODO	 .insert("defs", ":first-child")
      // defsEl.setAttribute("class", "svg-crowbar");

      var styleEl = document.createElement("style")
      defsEl.appendChild(styleEl);
      styleEl.setAttribute("type", "text/css");


      // removing attributes so they aren't doubled up
      svg.removeAttribute("xmlns");
      svg.removeAttribute("xlink");

      // These are needed for the svg
      if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
        svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
      }

      if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
        svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
      }

      if (svgs.length > 0) { // TODO: improve with loop?
        while (svgs[1].childNodes.length > 0) {
          svg.appendChild(svgs[1].childNodes[0]);
        }
      }

      // Remove link
      var linkElements = svg.getElementsByClassName("js-plot-link-container");
      while (linkElements[0]) {
        linkElements[0].parentNode.removeChild(linkElements[0]);
      }

      var source = (new XMLSerializer()).serializeToString(svg).replace('</style>', '<![CDATA[' + styles + ']]></style>');
      var rect = svg.getBoundingClientRect();
      svgInfo = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        class: svg.getAttribute("class"),
        id: svg.getAttribute("id"),
        childElementCount: svg.childElementCount,
        source: [doctype + source]
      };
    });
    return svgInfo;
  }

  function download(source) {
    var filename = "plotly";


    var url = window.URL.createObjectURL(new Blob(source.source, {
      "type": "text\/xml"
    }));

    var a = document.createElement("a");
    body.appendChild(a);
    a.setAttribute("class", "svg-crowbar");
    a.setAttribute("download", filename + ".svg");
    a.setAttribute("href", url);
    a.style["display"] = "none";
    a.click();

    setTimeout(function() {
      window.URL.revokeObjectURL(url);
    }, 10);
  }

  function getStyles(doc) {
    var styles = "",
      styleSheets = doc.styleSheets;

    if (styleSheets) {
      for (var i = 0; i < styleSheets.length; i++) {
        processStyleSheet(styleSheets[i]);
      }
    }

    function processStyleSheet(ss) {
      if (ss.cssRules) {
        for (var i = 0; i < ss.cssRules.length; i++) {
          var rule = ss.cssRules[i];
          if (rule.type === 3) {
            // Import Rule
            processStyleSheet(rule.styleSheet);
          } else {
            // hack for illustrator crashing on descendent selectors
            if (rule.selectorText) {
              if (rule.selectorText.indexOf(">") === -1) {
                styles += "\n" + rule.cssText;
              }
            }
          }
        }
      }
    }
    return styles;
  }

})();