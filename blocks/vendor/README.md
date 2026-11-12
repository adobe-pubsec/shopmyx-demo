# vendor

Custom **vendor** block. Purpose: one vendor at a store location (a tile in a store's directory). Each vendor is its own document (a fragment) under `/store-locator/<installation>/vendors/`, placed on the store page with the `vendor-list` block.

## Authoring (Document Authoring)

Key-value rows, like the metadata block. Keys are case-insensitive and can be in any order; leave out rows you don't need.

| Vendor   |                                         |
| -------- | --------------------------------------- |
| Name     | Starbucks                               |
| Logo     | *(image, or a Dynamic Media/Scene7 link)* |
| Location | Bldg. 4250                              |
| Phone    | (254) 532-0055                          |
| Hours    | Mon-Fri 0700-1900 / Sat 0800-1900 / ... |
| Delivery | [DoorDash](https://www.doordash.com/)   |
| Note     | free text, links allowed                |

| Key | Required | Shown as |
| --- | --- | --- |
| Name | Yes | Vendor name. Hidden when it is the same as the heading above its vendor list (e.g. "Exchange Admin"). |
| Logo | No | Logo (73px), alt text empty because the name is next to it |
| Location | No | Building or address lines inside a group |
| Phone | No | One per line; dialable numbers become `tel:` links ("DSN 737-3607" stays text) |
| Hours | No | **Free text**, one line per range, shown as written |
| Delivery | No | A link to the delivery partner; DoorDash links show the DoorDash badge (`/icons/delivery-doordash.png`) |
| Note | No | Free text; links are kept |

Add page metadata `Robots: noindex` to each vendor document (vendors only appear inside store pages).

On preview (`localhost`, `*.aem.page`), a missing Name, an unknown key or a delivery link without a badge is outlined in red with an explanation.

## Library

Sample: `content/library/blocks/vendor.plain.html` ("Vendor"). To guide the Delivery key in Document Authoring, add a block option in the library configuration: key `delivery`, blocks `vendor`, values `DoorDash|https://www.doordash.com/`.

## Supported variations

No variations.
