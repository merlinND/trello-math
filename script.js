/**
 * Script to be injected into the electron app.
 */

var MAX_INDIVIDUAL_NODES = 50;
var LAST_DOM_EVENT_DELAY = 300;  // In ms.

function triggerMath(elements) {
    if (typeof MathJax !== 'undefined') {
        console.log("Triggering MathJax typesetting")
        if (!elements || elements.length >= MAX_INDIVIDUAL_NODES) {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
        } else {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, elements]);
        }
    }
}

/**
 * Automatically queue Math preview when the DOM changes (e.g. when new content
 * has been added by the user, navigation happened, etc).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 */
function setupMutationObserver() {
    var waitingFor = 0;
    var elements   = [];
    var queueElements = function(els) {
        elements += els;
        waitingFor += 1;

        setTimeout(function() {
            waitingFor -= 1;
            if (waitingFor <= 0) {
                waitingFor = 0;
                triggerMath(elements);
                elements = [];
            }
        }, LAST_DOM_EVENT_DELAY);
    };

    var target = document.querySelector('#classic');
    var options = { attributes: false, childList: true, characterData: true, subtree: true };
    var observer = new MutationObserver(function(r) {
        // Heuristics to prune unnecessary typesets
        if (r.length <= 1) {
            return;
        }
        var r0 = r[0];
        if (r0.addedNodes.length > 0) {
            var a0 = r0.addedNodes[0].attributes;
            if (a0 !== undefined && r0.addedNodes <= 3 && ('class' in a0) && a0['class'].value.indexOf("badge") >= 0) {
                return;
            }
        }
        if (r0.addedNodes.length <= 1 && r0.removedNodes.length <= 1
            && r0.target && r0.target.attributes && ('dt' in r0.target.attributes)) {
            return;
        }

        var added = [];
        for (var i = 0; i < r.length; i++) {
            for (var j = 0; j < r[i].addedNodes.length; j++) {
                var e = r[i].addedNodes[j];

                if (e.wholeText == "New stuff!") {
                    continue;
                }

                if (e.attributes && ('class' in e.attributes)) {
                    var cls = e.attributes['class'].value;
                    if (e.nodeName === "math"
                        || cls.indexOf("Math") >= 0
                        || cls.indexOf("date") >= 0
                        || ('dt' in e.attributes)
                        || ('id' in e.attributes && e.attributes['id'].value.indexOf("Math") >= 0)) {
                        // Avoid infinite loops or unnecessary typesetting operations
                        return;
                    }
                }

                added.push(e);
                if (added.length >= MAX_INDIVIDUAL_NODES) {
                    break;
                }
            }
        }
        queueElements(added);
    });
    observer.observe(target, options);
}


document.addEventListener("keydown", function (e) {
    if (e.which === 123) {
        // F12
        require("electron").remote.BrowserWindow.getFocusedWindow().webContents.toggleDevTools();
    } else if (e.which === 116) {
        // F5
        location.reload();
    } else if (e.which === 79) {
        // O
        triggerMath();
    }
});

// Adapted from:
// https://github.com/fsavje/math-with-slack
document.addEventListener('DOMContentLoaded', function() {
    var mathjax_config = document.createElement('script');
    mathjax_config.type = 'text/x-mathjax-config';
    mathjax_config.text = "                                                           \
    MathJax.Hub.Config({                                                              \
      messageStyle: 'none',                                                           \
      extensions: ['tex2jax.js'],                                                     \
      jax: ['input/TeX', 'output/HTML-CSS'],                                          \
      tex2jax: {                                                                      \
        displayMath: [['\$\$', '\$\$']],                                              \
        element: 'msgs_div',                                                          \
        ignoreClass: 'ql-editor',                                                     \
        inlineMath: [['\$', '\$']],                                                   \
        processEscapes: true,                                                         \
        skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']          \
      },                                                                              \
      TeX: {                                                                          \
        extensions: ['AMSmath.js', 'AMSsymbols.js', 'noErrors.js', 'noUndefined.js']  \
      }                                                                               \
    });                                                                               \
    ";

    var mathjax_script = document.createElement('script');
    mathjax_script.type = 'text/javascript';
    mathjax_script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX_CHTML';

    document.head.appendChild(mathjax_config);
    document.head.appendChild(mathjax_script);

    console.log("MathJax scripts added.");
    triggerMath();
    setupMutationObserver();
});
