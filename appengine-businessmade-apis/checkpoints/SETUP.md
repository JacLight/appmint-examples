# Prepare the service-desk training records

Run the checkpoints against a training organization you control. Start with a normal authorized staff session from the Authentication course and the assigned API base URL. Every request below uses `orgid: YOUR_ORGANIZATION`, `Authorization: Bearer YOUR_STAFF_TOKEN` and, for JSON writes, `Content-Type: application/json`. Use the [maintained API reference](https://appengine.appmint.io/documentation) to check current permissions and fields. The development proxy is not a platform administrator and does not grant permissions.

These request shapes come from the controlled course setup. They create real saved training records. Inspect existing records first and reuse suitable ones; do not run a broad setup scenario against an established business just to follow this lesson. Choose a unique practice location name and replace the matching name in every body. Keep each response before continuing. If a request times out, reconcile the saved record before submitting again; these examples do not provide an automatic creation retry key.

## 1. Inspect business setup

Send `GET /business-made/setup/status`. An organization owner/admin can complete the business profile using the normal BusinessMade setup screens. This example does not require reapplying a scenario or overwriting an existing profile. The detailed course reference's **Set up the shop** section explains profile and scenario operations if the organization itself has not been configured.

## 2. Create or choose one branch

Send `PUT /repository/create` with this JSON, substituting your unique `name` and intended training address. The example tax rate is for reproducing the exercise, not tax advice or a production default.

```json
{
  "datatype": "location",
  "isNew": true,
  "data": {
    "name": "YOUR_TRAINING_LOCATION",
    "title": "Service Desk Training",
    "type": "address",
    "status": "active",
    "timezone": "America/Chicago",
    "taxRate": 8.15,
    "address": {
      "street": "YOUR_TRAINING_STREET",
      "city": "YOUR_CITY",
      "state": "YOUR_STATE",
      "postalCode": "YOUR_POSTAL_CODE",
      "country": "US"
    },
    "pos": {
      "printReceiptOnSettle": false,
      "openDrawerOnCashTender": false,
      "header": { "name": "Service Desk Training" },
      "footer": { "thankYou": "Thank you for visiting" },
      "width": 48
    }
  }
}
```

Preserve `data.name` as the `businessLocationId`. This is different from the branch record's `sk`. Enter that name in the client's location form. Printing and cash-drawer actions are disabled here; the receipt lesson renders the returned document without claiming a physical printer result.

## 3. Create two service stands

Send `PUT /repository/create` once for each stand. Use a distinct `name`/`displayName` for the second stand. Both must refer to the same branch name, and both must actually be available before the exercise starts.

```json
{
  "datatype": "service_point",
  "isNew": true,
  "data": {
    "name": "YOUR_UNIQUE_STAND_1",
    "displayName": "Stand 1",
    "kind": "stand",
    "businessLocationId": "YOUR_TRAINING_LOCATION",
    "businessLocation": "YOUR_TRAINING_LOCATION",
    "status": "available",
    "capacity": 1,
    "isActive": true
  }
}
```

Preserve each returned service-point `sk`. The client displays the stand's name but sends its `sk` when assigning the arrival. Do not turn an occupied real stand into an available stand by editing its status just to make the demonstration pass.

## 4. Create two service catalogue items

Send `PUT /repository/create` for each body, replacing the SKU/slug/name values with unique training values and the location with your actual branch name.

```json
{
  "datatype": "sf_product",
  "isNew": true,
  "data": {
    "name": "Training tune-up",
    "sku": "YOUR_TUNE_SKU",
    "slug": "your-training-tune-up",
    "price": 60,
    "tax": true,
    "type": "service",
    "businessLocations": ["YOUR_TRAINING_LOCATION"]
  }
}
```

```json
{
  "datatype": "sf_product",
  "isNew": true,
  "data": {
    "name": "Training chain replacement",
    "sku": "YOUR_CHAIN_SKU",
    "slug": "your-training-chain-replacement",
    "price": 18,
    "cost": 10,
    "tax": true,
    "type": "service",
    "businessLocations": ["YOUR_TRAINING_LOCATION"]
  }
}
```

These are service charges, not an inventory-consumption demonstration. The job records $10 of material cost; the catalogue charges $18 for the second service. They are separate values. The server computes the sale's prices and location tax; with these two taxable prices and the example rate, the observed course total was $84.36. Always use the returned `balanceDue` rather than hard-coding that figure.

## 5. Choose or create a mechanic

Reuse an active training employee if suitable. To create one, send `POST /business-made/employees` with the following shape. Replace the identifier and dates and use a controlled contact. Verify the organization's notification configuration first; do not enter an unrelated person's email or phone.

```json
{
  "employeeId": "YOUR_UNIQUE_TRAINING_EMPLOYEE",
  "personalInfo": { "firstName": "Training", "lastName": "Mechanic" },
  "contactInfo": { "email": "YOUR_CONTROLLED_EMAIL" },
  "employment": {
    "hireDate": "YYYY-MM-DD",
    "startDate": "YYYY-MM-DD",
    "jobTitle": "Bike mechanic",
    "employmentType": "part-time",
    "status": "active"
  },
  "compensation": {
    "payType": "hourly",
    "hourlyRate": 20,
    "payFrequency": "bi-weekly"
  }
}
```

Preserve the employee record's returned `sk`, which is the mechanic selector's value. Its human-readable employee ID is a different field. The job-time lesson records work-order costing; it does not run payroll or pay this employee.

## 6. Verify before creating the arrival

Use your encoded location name in these reads:

- `GET /checkin/service-point/available?businessLocationId=YOUR_TRAINING_LOCATION` must return the intended available stands.
- `GET /storefront/pos/readiness?businessLocationId=YOUR_TRAINING_LOCATION` must pass the actual server checks. Resolve any reported setup reason before proceeding.
- Run checkpoint02's location form. Confirm the intended products, employee and floor are visible, not merely that the request returned HTTP200.

Assignment can invoke the organization's customer-ready notification path. Use a controlled notification provider/sink and controlled customer contacts before running the arrival sequence. This companion does not configure a provider or suppress delivery by changing an email label. The recorded course verified local notification routing and makes no external-delivery claim.

Once verified, run checkpoint05 continuously for the integration exercise, or follow the independent-stage instructions in [README.md](README.md). A reload does not release a saved stand or undo a tender. Finish or inspect the practice visit through authorized business operations; never delete records or replay payment writes just to reset the screen.
