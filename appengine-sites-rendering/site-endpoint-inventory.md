# Current Site controller inventory

Source inspected for this course. Routes listed for discovery; unshown actions are not claimed rehearsed. See hosted API reference for payloads, roles and side effects.

- `GET /site/get-org/:domainName`
- `GET /site/company/:domainName?`
- `GET /site/get-site/:configSiteName/:domainName?`
- `GET /site/get-site-by-hostname/:hostname?`
- `GET /site/get-site-host-mappings/:siteName?`
- `GET /site/base-url`
- `GET /site/org-sites/:siteOrgId`
- `POST /site/attach-domain`
- `POST /site/:site/features/:feature/link`
- `POST /site/make-site-template`
- `POST /site/create-site`
- `POST /site/clone-site`
- `DELETE /site/delete-site/:siteOrgId/:siteId`
- `POST /site/change-site-domain-names`
- `DELETE /site/unregister-site-domain/:siteId/:domainName`
- `GET /site/page/:hostName/:siteName/*`
- `GET /site/page/:hostName/:siteName`
- `POST /site/page/:hostName/:siteName/*`
- `GET /site/page-data/:datatype/:dataId?`
- `POST /site/site-map`
- `GET /site/app/dsl/:name`
- `POST /site/add`
- `POST /site/remove`
- `POST /site/create`
- `GET /site/limits`
- `GET /site/usage-stats`
- `GET /site/plan-limits`
- `POST /site/update-domain/:domain?`
- `POST /site/remove-domain/:domain?`
- `POST /site/apply-template`
- `POST /site/fix-domains`