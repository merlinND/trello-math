/**
 * Script to be injected into the electron app.
 */

function triggerMath() {
    if (typeof MathJax !== 'undefined') {
        console.log("Triggering typesetting")
        MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
    }
}

/**
 * Automatically queue Math preview when the DOM changes (e.g. when new content
 * has been added by the user, navigation happened, etc).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 */
function setupMutationObserver() {
    // // Select the node that will be observed for mutations
    // var targetNode = document.getElementById('some-id');
    // // Options for the observer (which mutations to observe)
    // var config = { attributes: false, childList: true, subtree: true };

    // // Callback function to execute when mutations are observed
    // var observer = new MutationObserver(function(mutationsList) {
    //     console.log(mutationsList);
    //     triggerMath();
    // });

    // observer.observe(targetNode, config);

    // TODO: Find more specific events?
    // - Card opened / closed
    // - Board opened / closed
    // - Card description done editing

    var target = document.querySelector('#classic');
    var options = { attributes: false, childList: true, characterData: true, subtree: true };
    var observer = new MutationObserver(function(r) {
        // Heuristics to prune unnecessary typesets
        if (r.length <= 1) {
            return;
        }
        r0 = r[0];
        if (r[0].addedNodes.length <= 0) {
            return;
        }
        a0 = r[0].addedNodes[0].attributes
        if (a0 !== undefined && ('class' in a0) && a0['class'].value.indexOf("badge") >= 0) {
            return;
        }


        // TODO: more specific focus for the typesetting operation
        console.log("From parent: " + r);
        triggerMath();
    });
    observer.observe(target, options);

    var target = document.querySelector('.window-overlay');
    var options = { attributes: false, childList: true, characterData: true, subtree: true };
    var observer = new MutationObserver(function(r) {
        // TODO: more specific focus for the typesetting operation
        console.log("From window: " + r);
        triggerMath();
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
    mathjax_script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX-MML-AM_CHTML';

    document.head.appendChild(mathjax_config);
    document.head.appendChild(mathjax_script);

    console.log("MathJax scripts added.");
    triggerMath();
    setupMutationObserver();
});
