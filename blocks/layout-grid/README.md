# Layout Grid

Arrange linked promotional images without nested blocks. Choose a named layout,
then add one image per row. All promotional text belongs in the artwork.

## Choose a Layout

Keep the block heading **Layout Grid**. The first content row below that heading
contains the layout selection, for example **Feature Left**. Images start on the
next row. The options row is not displayed on the published page.

| Dropdown label | Stored value | Images | Desktop arrangement |
| --- | --- | --- | --- |
| Equal Tiles: Two Columns | Two Columns | Any | Two equal tiles per row |
| Equal Tiles: Three Columns | Three Columns | Any | Three equal tiles per row; the default |
| Equal Tiles: Four Columns | Four Columns | Any | Four equal tiles per row |
| Feature Left | Feature Left | Five | One large square left, four small squares right |
| Feature Right | Feature Right | Five | Four small squares left, one large square right |
| Wide Left | Wide Left | Three | One wide tile left, two square tiles right |
| Wide Right | Wide Right | Three | Two square tiles left, one wide tile right |

For a block inspector dropdown, target the first content row's first cell
(row 0, cell 0; the block heading is not counted), use the labels and stored values
above, and set **Three Columns** as the default. Hyphenated values such as
`feature-right` are also accepted. This repository does not contain the inspector's
options sheet; it must be configured separately in Document Authoring.

The options row may be a single merged cell or have an empty second cell. A
two-cell `Layout | Feature Right` row is also accepted; the value belongs in the
last cell. Empty or unrecognized values use Three Columns. Older documents that
use a class-based variant without an options row remain supported.

Layout sketches use numbers matching the image rows in the document:

```text
Feature Left         Feature Right
+-------+---+---+    +---+---+-------+
|       | 2 | 3 |    | 1 | 2 |       |
|   1   +---+---+    +---+---+   5   |
|       | 4 | 5 |    | 3 | 4 |       |
+-------+---+---+    +---+---+-------+

Wide Left            Wide Right
+-------+---+---+    +---+---+-------+
|   1   | 2 | 3 |    | 1 | 2 |   3   |
+-------+---+---+    +---+---+-------+
```

The kitchen example is **Feature Left**: KitchenAid, Instant Pot, Food Storage,
Paper & Plastic, Cleaning Supplies. The electronics example is **Feature Right**:
Amazon, Apple, Acer, Cameras, LG.

## Add Images and Links

| Layout Grid | |
| --- | --- |
| Feature Left | |
| KitchenAid image | [KitchenAid](https://www.shopmyexchange.com/) |
| Instant Pot image | [Instant Pot](https://www.shopmyexchange.com/) |
| Food Storage image | [Food Storage](https://www.shopmyexchange.com/) |
| Paper & Plastic image | [Paper & Plastic](https://www.shopmyexchange.com/) |
| Cleaning Supplies image | [Cleaning Supplies](https://www.shopmyexchange.com/) |

Replace the example destinations with the real category links. An image may
instead be linked directly in a single cell; a second link cell is optional.
Images without links are supported. Blank rows are ignored.

Use square artwork for equal tiles and large features, and 2:1 artwork for wide
features. Images are never cropped, so offers and small print remain visible.
Provide meaningful image alt text including the offer and destination. Descriptive
link text is used as the accessible name when an image has no alt text.

## Responsive Behavior

Below 900px, tiles use two columns. The feature spans the full width in its authored
position: Feature Left first, Feature Right after its four supporting images.
Reading order, tab order, and mobile order always match the document.

Equal layouts accept any number of images. Feature layouts are designed for five
images and wide layouts for three. Extra images continue as equal tiles after the
chosen arrangement; use another block to start a new arrangement. Missing images
do not produce empty cards, but may leave an incomplete arrangement.