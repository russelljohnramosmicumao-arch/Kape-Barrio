Kape' Bar-Rio POS – Version 5

Changes:
- Drink photos cropped from the supplied menu artwork.
- Menu prices are hidden until the customer chooses a size (and Budget/Premium where applicable).
- Swipe left/right across the drink grid to move between menu categories.
- Removed the always-visible order panel.
- Added a floating cart button on the right side with a live item-count badge.
- Tap the cart button to open the order cart. On iPad/desktop the cart opens as a right-side drawer; on smaller screens it opens as a drawer.
- Cart includes quantity +/- controls, remove, total, and receipt generation.
- Offline/localStorage behavior remains.

IMPORTANT: Verify all menu names and prices before live use.


Version 10 adds Transaction History. Completed orders are stored locally on this iPad using localStorage. The History button on the right opens saved transactions, and each transaction has a Save picture button.


Menu Manager
Open Barista > Manage Menu, or visit menu.html. Add items, categories,
photos, standard prices and premium prices. Changes are saved on this
browser only, and new orders use the updated menu. Existing cart items
and orders keep their recorded prices. Export/import backups to transfer
the menu to another device. Edits do not automatically sync across devices.
This is local management, not secure server-side admin access.

GitHub installation: Upload all contents of Kape-Barrio-main to your existing
repository, replacing matching files and adding the four menu files.
Keep images and logo.png. Reopen the app after deployment; close and reopen
once more if needed for the service worker update.

Fruit Soda & Ice Cream update
All six Soda flavours have Fruit Soda in their names. Existing saved menus
are upgraded while retaining custom prices and photos. Ice Cream includes
Creambar, Pinipig Ice Cream, Regular Cone, Jumbo Cone and Ice Cream Bilog.
These require a price in Menu Manager before they can be ordered.
Barista per-item controls offer Ice cream scoop (25 pesos) and Extra pearl
(20 pesos), with plus/minus quantities beside discounts. Add-ons are not
discounted. They are persisted with the order and included in totals,
receipts and sales history. Paid orders cannot accept add-on edits.
