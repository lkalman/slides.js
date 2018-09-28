// ////////////////////////////////////////////////////////////////
/*
# Slides using HTML5 and CSS
If you are familiar with HTML and CSS transforms and the like, you can create presentations very easily using `slides.js`.

## Documentation
### The basic idea
The HTML file specifies a HTML body containing all
slides, and we specify for each step which part of them to
show, and in what way.  You create a large area (the body of the
document), and you can move around by controlling how the body
is shown (by moving the body using the `translate` transform).
For example, if you want to show the windowful to the right of
the current slide, move the body one viewport width to the left
(using the `translate` transformation).
At the same time, you can modify any element in the body on
a step by step basis (e.g., visibility, scaling) in the same
way, using the given element's attributes.

### Requirements on the HTML file:
* It must be HTML5, i.e, start with `<!doctype html>`.
* The value of the special attribute `data-stepstyles`
  determines the behaviour of an element.
  That value is a space-separated list of specifications of
  the following form:
  
  - The specification of relevant steps is followed by a
    semicolon-separated list of CSS style elements.
    The relevant steps can be specified in the following way.
    The first element is an optional integer followed by `>`,
    indicating that the rule applies only when we get here
    from the step indicated by the integer.
    This is followed by `[n]` or `[n-m]` indicating that the
    style applies in step `n` or from step `n` to step `m`.
    In the former case, `n` is optional (its absence means
    a default style).  In the latter case, `n` and `m` (but not both)
    are optional, `[n-]` indicates "from step `n` on", and
    `[-m]` indicates "up to step `m`".
  - Remember that every animated element will be styled
    in a default manner in those steps where you don't
    specify a style (you can define the default yourself,
    of course, using `[]`).
  - Add
    ```html
    <script src="path/URL of slides.js"></script>
    ```
    to the `<head>` section of your document, and
  - add
    ```html
    <script>
      // <!--
      slides( document, window ).init();  
      // -->
    </script>
    ```
    at the end of the document body.
  - The initial step is 0.

### Query parameters:
* `cycle`: 1 (default): start over after last slide, go to
  last slide from first if 'back' is requested. 0: do nothing
  after last slide or before first.
* `step=n` (default: 0): start from step No. `n`
*/
// ////////////////////////////////////////////////////////////////

var slides =
    function( document, window )
{
    function processQueryParameters( window, body )
    {
        var urlParams = new URLSearchParams( window.location.search );
        // Check for 'cycle' parameter:
        var cycleStr = urlParams.get( 'cycle' );
        var cycle = 1;
        if ( cycleStr )
        {
            switch ( cycleStr )
            {
                case '0': cycle = 0; break;
                case '1': cycle = 1; break;
                default:
                {
                    var errmsg =
                        "Bad 'cycle' value \"" + cycleStr + "\"";
                    alert( errmsg );
                    throw( new Error( errmsg ) );
                }
            }
        }
        // Check for 'step' parameter:
        var currentStep = 0;
        var cStep = urlParams.get( 'step' );
        if ( cStep )
        {
            currentStep = parseInt( cStep );
        }
        return( { cycle: cycle, currentStep: currentStep } );
    }
    // used by 'processHTMLFile()':
    function defineViewport( document, head )
    {
        // Define viewport so that height and width adapt to your device:
        var meta = document.createElement( "meta" );
        meta.content =
            "width=device-width, height=device-height, minimum-scale=1, maximum-scale=1, user-scalable=no";
        meta.name="viewport";
        head.appendChild( meta );
    }
    function getOverlayPrefix( overlayStr, steps )
    {
        var newSteps = steps;
        var fromStep = -1;
        var rest = overlayStr;
        var xArray;
        if ( xArray = overlayStr.match( /^([0-9]*)\s*>(.*)$/ ) )
        {
            var fromStepPref = xArray[1];
            if ( fromStepPref != "" )
            {
                var maybeStep = parseInt( fromStepPref );
                if ( isNaN( maybeStep ) )
                {
                    var errmsg =
                        "Bad overlay prefix: \"" +
                        xarray[1] + ">\"";
                    alert( errmsg );
                    throw( new Error( errmsg ) );
                }
                else
                {
                    if ( maybeStep > steps )
                    {
                        newSteps = maybeStep;
                    }
                    fromStep = maybeStep;
                }
            }
            rest = xArray[2];
        }
        return( { steps: newSteps
                  , fromStep: fromStep
                  , rest: rest } );
    }
    function getOverlayInfo( text, overlay, steps )
    {
        var newSteps = steps;
        var startStep = -1;
        var endStep = -1;
        var xArray;
        if ( xArray = overlay.match( /^\s*([0-9]*)$/ ) )
        {
            if ( xArray[1] == "" )
            {
                // a default:
                startStep = endStep = -1;
            }
            else
            {
                // Just an integer:
                startStep = endStep = parseInt( xArray[1] );
                if ( startStep > newSteps )
                {
                    newSteps = startStep;
                }
            }
        }
        else if ( xArray =
                  overlay.match(
                          /^\s*([0-9]*)\s*-\s*([0-9]*)$/ ) )
        {
            // A range:
            var startStepStr = xArray[1];
            var endStepStr = xArray[2];
            if ( startStepStr == "" )
            {
                // an 'up to' range:
                if ( endStepStr == "" )
                {
                    // both cannot be missing:
                    var errmsg =
                        "Illegal empty range in" + text;
                    alert( errmsg );
                    throw( new Error( errmsg ) );
                }
                else
                {
                    endStep = parseInt( endStepStr );
                    if ( endStep > newSteps )
                    {
                        newSteps = endStep;
                    }
                }
                
            }
            else
            {
                // 'startStepStr' is an integer:
                startStep = parseInt( startStepStr );
                if ( startStep > newSteps )
                {
                    newSteps = startStep;
                }
                if ( endStepStr != "" )
                {
                    endStep = parseInt( endStepStr );
                    if ( endStep > newSteps )
                    {
                        newSteps = endStep;
                    }
                }
            }
        }
        return(
            { steps: newSteps
              , startStep: startStep
              , endStep: endStep } );
    }
    function getOverlaySpecs( text, overlay, steps )
    {
        // return { steps: <new value of 'steps'>
        //         , specList: <specifications> }
        var newSteps = steps;
        // 'overlay' is in fact a comma-separated list of
        // overlay specifications:
        var overlays = overlay.split( /\s*,\s*/ );
        specList = [];
        for ( var i = 0; i < overlays.length; ++i )
        {
            overlayStr = overlays[i];
            // Every overlay specification can be prefixed
            // with an integer plus ">" to indicate that
            // the overlay applies when the previous step
            // is that integer.
            // 'prefixInfo' is a struct {steps, fromStep, rest}:
            var prefixInfo =
                getOverlayPrefix( overlayStr, newSteps );
            newSteps = prefixInfo.steps;
            // The rest of an overlay specification is either
            // an integer or a range:
            var overlayInfo =
                getOverlayInfo( text, prefixInfo.rest, newSteps );
            newSteps = overlayInfo.steps;
            specList.push(
                { fromStep: prefixInfo.fromStep
                  , startStep: overlayInfo.startStep
                  , endStep: overlayInfo.endStep } );
        }
        return( { steps: newSteps, specList: specList } );
    }
    function getStepStyles( document, animated )
    {
        var steps = 0;
        var stepInfo = [];
        for ( var i = 0; i < animated.length; ++i )
        {
            var el = animated[i];
            // A value must exist, because this is how
            // 'animated' has been collected:
            var stepStylesStr = el.dataset.stepstyles;
            // Make the regular expression global, so that all
            // matches are found:
            var stepStylesRE = /[^\[]*\[([^\]]*)\]([^\[]*)/g;
            var elementInfo = [];
            while ( true )
            {
                // Apply exec() again and again to get all
                // matches:
                var xArray = stepStylesRE.exec( stepStylesStr );
                if ( xArray )
                {
                    var overlay = xArray[1]; // group 1
                    var text = xArray[2];    // group 2
                    // 'overlaySpecs' is a structure
                    // {steps, specList}, where
                    // 'specList' is a list of structures
                    // {fromStep, startStep, endStep}.
                    overlaySpecs =
                        getOverlaySpecs( stepStylesStr, xArray[1]
                                         , steps );
                    steps = overlaySpecs.steps;
                    elementInfo.push(
                        { overlays: overlaySpecs.specList
                          , text: text } );
                }
                else
                {
                    break;
                }
            }
            stepInfo.push(
                { element: el
                  , elementIndex: i
                  , info: elementInfo } );
        }
        return( { steps: steps, stepInfo: stepInfo } );
    }
    function rangeSelectors( startStep, endStep, prefixText )
    {
        // return a list of selector strings, each prefixed
        // with 'prefixText'.
        var selectorList = [];
        for ( var l = startStep; l <= endStep; ++l )
        {
            selectorList.push(
                prefixText + "[data-step='" + l.toString() + "']" );
        }
        return( selectorList );
    }
    function processRange( steps, prefixText
                           , startStep, endStep, selectorText )
    {
        // Return a comma-separated list of selectors,
        // each prefixed with 'prefixText',
        // and potentially expanding a range
        // (or containing a single step element or a
        // single default selector):
        var selectorList = null;
        if ( startStep < 0 )
        {
            if ( endStep >= 0 )
            {
                // from 0 to endStep:
                selectorList =
                    rangeSelectors( 0, endStep, prefixText );
            }
            else
            {
                // a default:
                selectorList = [prefixText];
            }
        }
        else        // startStep is an integer
        {
            if ( endStep < 0 )
            {
                // from startStep to steps:
                selectorList =
                    rangeSelectors(
                        startStep, steps, prefixText );
            }
            else    // endStep is an integer:
            {
                // from startStep to endStep:
                selectorList =
                    rangeSelectors(
                        startStep, endStep, prefixText );
            }
        }
        return( selectorList );
    }
    function processSpecList( document, additionalStyle, steps
                              , idText, specList, text )
    {
        // 'idText' is a selector identifying the animable element;
        // 'specList' is a list of {fromStep, startStep, endStep}
        // structures.
        // 'selectorText' will be a comma-separated list of
        // (alternative) selectors, each member of which is a
        // concatenation (conjunction) of selectors, starting with
        // 'idText', potentially followed by a 'data-fromstep' selector
        // and a 'data-step' selector.
        var selectorLists = [];
        for ( var k = 0; k < specList.length; ++k )
        {
            var fromStep = specList[k].fromStep;
            var startStep = specList[k].startStep;
            var endStep = specList[k].endStep;
            var fromText = "";
            if ( fromStep >= 0 )
            {
                fromText +=
                    "[data-fromstep='" +
                    fromStep.toString() + "']";
            }
            selectorLists =
                selectorLists.concat(
                    processRange( steps, idText + fromText
                                  , startStep
                                  , endStep ) );
        }
        additionalStyle.appendChild(
            document.createTextNode(
                selectorLists.join( ", " ) + " {" + text + "}" ) );
    }
    function processStepStyles( document, currentStepStr
                                , stepInfo, steps
                                , additionalStyle )
    {
        for ( var i = 0; i < stepInfo.length; ++i )
        {
            var style = stepInfo[i];
            var element = style.element;
            var elementId = style.elementIndex.toString();
            var info = style.info;
            var idText =
                "[data-animable='" + elementId + "']";
            // initialize element attributes:
            element.dataset.animable = elementId;
            element.dataset.step = currentStepStr;
            // go through { overlays, text } structures
            // (where 'overlays' is a list of
            // { fromStep, startStep, endStep } structures):
            for ( var j = 0; j < info.length; ++j )
            {
                processSpecList(
                    document, additionalStyle, steps
                    , idText
                    , info[j].overlays
                    , info[j].text );
            }
        }
    }

    function setupAnimated( document, head, body, currentStepStr )
    {
        // Collect all animated elements, assign a unique identifier
        // to each of them, and initialize their attributes
        // and styles.
        var additionalStyle =
            document.createElement( "style" );
        // WebKit hack: :(
        additionalStyle.appendChild( document.createTextNode( "" ) );
        head.appendChild( additionalStyle );

        var animated = document.querySelectorAll( '[data-stepstyles]' );
        // First collect all the step styles so that the largest
        // step can be calculated:
        var stepStyles = getStepStyles( document, animated );
        // 'stepStyles' is a structure { steps, stepInfo } where
        // 'steps' is the number of steps (the largest step), and
        // 'stepInfo' is a list of { element, elementIndex, info }
        // structures, where
        // 'element' is an element, 'elementIndex' is its ID, and
        // 'info' is a list of structures { overlays, text } where
        // 'overlays' is a list of selector info structures
        // { fromStep, startStep, endStep } for constructing
        // selectors; 'text' is CSS code.
        var steps = stepStyles.steps;
        // Initialize special attributes of 'body' element:
        body.dataset.numberofsteps = steps.toString();
        body.dataset.currentstep = currentStepStr;
        body.dataset.previousstep = "-1";
        // Process collected step styles:
        processStepStyles(
            document
            , currentStepStr
            , stepStyles.stepInfo
            , steps
            , additionalStyle
        );
        return( { animated: animated, steps: steps } );
    }
    function processHTMLFile( document, window, head, body, currentStep )
    {
        // Set up viewport:
        // Note: the 'width' and 'height' variables will not be used.
        // You can get the device screen width via the screen.width
        // property.
        // Sometimes it's also useful to use window.innerWidth
        // (not typically found on mobile devices) instead of
        // screen width when dealing with desktop browsers where
        // the window size is often less than the device screen size.
        var width =
            (window.innerWidth > 0) ? window.innerWidth : screen.width;
        var height =
            (window.innerHeight > 0) ? window.innerHeight : screen.height;
        defineViewport( document, head );

        // Set up animated elements:
        var params =
            setupAnimated( document, head, body, currentStep.toString() );
        return( params );
    }            
    // Used by functions invoked at keystrokes:
    function updateStep( body, animated, previousStep, newStep )
    {
        var previousStr = previousStep.toString();
        var nextStr = newStep.toString();
        body.dataset.previousstep = previousStr;
        body.dataset.currentstep = nextStr;
        for ( var i = 0; i < animated.length; ++i )
        {
            animated[i].dataset.fromstep = previousStr;
            animated[i].dataset.step = nextStr;
        }
    }
    // Functions for stepping up/down, depending
    // on the 'cycle' parameter:
    function incrementStep( params )
    {
        var previousStep =
            parseInt( params.body.dataset.currentstep );
        if ( previousStep == params.steps ) // at end
        {
            if ( params.cycle == 1 )
            {
                updateStep( params.body, params.animated
                            , previousStep, 0 );
            }
        }
        else
        {
            updateStep( params.body, params.animated
                        , previousStep, previousStep + 1 );
        }
    }
    function decrementStep( params )
    {
        var previousStep =
            parseInt( params.body.dataset.currentstep );
        if ( previousStep == 0 ) // at beginning
        {
            if ( params.cycle )
            {
                updateStep( params.body, params.animated
                            , previousStep, params.steps );
            }
        }
        else
        {
            updateStep( params.body, params.animated
                        , previousStep, previousStep - 1 );
        }
    }
    // 'params' contains information that has been determined
    // at startup and will not change later, when keystrokes
    // are detected:
    function addKeyBindings( params )
    {
        // Space/PageDown moves one forward, Backspace/PageUp
        // moves one backwards:
        params.body.addEventListener(
            "keyup"
            , function( e )
            {
                e.preventDefault();
                switch ( e.key )
                {
                    case " ": case "PageDown":
                    {
                        incrementStep( params );
                        break;
                    }
                    case "Backspace": case "PageUp":
                    {
                        decrementStep( params );
                        break;
                    }
                    case "Home":
                    {
                        updateStep( params.body, params.animated
                                    , params.currentStep.toString()
                                    , "0" );
                        // var baseURL =
                        //     params.window.location.href.replace(
                        //        params.window.location.search
                        //        , ''
                        //    );
                        // params.window.location.href = baseURL;
                        break;
                    }
                    case "End":
                    {
                        updateStep( params.body, params.animated
                                    , params.currentStep.toString()
                                    , params.currentStep.toString() );
                        // var baseURL =
                        // params.window.location.href.replace(
                        // params.window.location.search
                        // , ''
                        // );
                        // params.window.location.href =
                        //     baseURL + "?step=" + params.steps.toString();
                        break;
                    }
                }
            }
        );
    }
    var init =
        function()
    {
        var body = document.body;
        // Prevent scrolling:
        body.style.overflow = "hidden";
        var head = document.head;
        var queryParams =
            processQueryParameters( window, body );
        var bodyParams =
            processHTMLFile( document, window, head, body
                             , queryParams.currentStep );
        var params =
            { document: document
              , window: window
              , head: head
              , body: body
              , animated: bodyParams.animated
              , steps: bodyParams.steps
              , cycle: queryParams.cycle
              , currentStep: queryParams.currentStep };
        addKeyBindings( params );
    };
    return( { init: init } );
};
