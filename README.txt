ORDERING REPOSITORY — Kape-Barrio

Upload every file in this ZIP to the ROOT of your existing Kape-Barrio repository. This is a separated code package, not the full original image archive.
KEEP your existing images/ folder, logo.png, and drink photos/thumbnail files. No existing image needs re-uploading.
Run 01-cashier-verification.sql in Supabase if you have not already applied the latest Cashier PIN drawer update. It is safe to rerun and requires the earlier barista accounts and drawer setup.
This package retains the latest cashier username/PIN forms and selected-denomination text fix, even though Main.zip contained the earlier form.

AFTER uploading this package, REMOVE these old manager implementation files from the ordering repository:
manager.js
manager-inventory.js
staff-manager.js
menu.html
menu.js
menu-sync.js
sales.html
sales.js
sales-data.js

REMOVE the unused old display files and obsolete duplicates:
display.html
display.js
payment.js
sw copy.js
menu-store copy.js
menu-defaults copy.js

KEEP manager.html FROM THIS ZIP. It is only a forwarding page for old Manager bookmarks, not manager tools.
KEEP menu-defaults.js and menu-store.js. Ordering needs these to display the menu.
Shared sync/login/update/payment helper files also stay in both repositories as required dependencies.

NEW MANAGER ADDRESS
https://russelljohnramosmicumao-arch.github.io/Kape-Barrio-Manager/
This repository name is configurable in app-links.js. If your manager repository name differs, change managerUrl in app-links.js in BOTH apps before uploading.
Publish the manager package before using the Manager link. Then update/refresh the ordering app on both devices.
The manager button is still shown only for the owner, and now opens the other repository.
Orders, payments, Pay Later, kitchen, transaction history, and Shift Records stay here.
Both apps use the same Supabase project, tables, and public configuration. Do not create another database for Manager.

VALIDATION
Both packages: JavaScript and inline script syntax, script/style/navigation dependencies and worker cache file existence checked.
Manager cache is separate from the ordering cache and both workers restrict handling to their own repository scope.
No live deployment or device browser validation was performed.
