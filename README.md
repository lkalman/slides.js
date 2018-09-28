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
