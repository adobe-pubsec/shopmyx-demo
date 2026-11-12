# store-info

Custom **store-info** block. Purpose: the header of a store-locator page: store name (page heading), address, hours and phones in a light panel, with the store photo beside it on desktop.

## Authoring (Document Authoring)

Key-value rows:

| Store Info  |                                       |
| ----------- | ------------------------------------- |
| Name        | Ft Hood Main Exchange                 |
| Image       | *(store photo)*                       |
| Address     | Clear Creek Exchange / Bldg. 4250 ... |
| Store Hours | Mon-Sat 0900-2000 / Sun 0900-1800     |
| Phone       | 254-532-7200 / HR Office 254-532-9514 |

- **Name** is the page heading (h1); **Image** is shown from 1024px; **Address** is one line per row.
- Any other key (Store Hours, Phone, …) is shown with the key as its label, in the order authored. Dialable phone numbers become `tel:` links; labels such as "HR Office" stay as text.

## Library

Sample: `content/library/blocks/store-info.plain.html` ("Store Info").

## Supported variations

No variations.
