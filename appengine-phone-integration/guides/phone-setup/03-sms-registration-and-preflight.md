## SMS Registration, Preflight and Status Review

Before testing text-message replies, inspect the line's SMS capability and registration state. In the number's menu, use **Register for SMS** where it is offered, or open the registration section in **Configure**. The drawer is **SMS Registration (A2P 10DLC)**. The exact path available depends on the number type and existing registration; do not force a local-number registration form onto a different number type merely to follow this example.

![Actual local Phone Management showing zero numbers and zero SMS Registered](assets/2026-10-02-enrichment/01-phone-service-start.png)

*Actual prerequisite state: there is no number row on which to open Register for SMS. Complete number/service setup first. The A2P form instructions below are checked against source; this organization could not demonstrate their populated editor or a successful submission, and this image is not an A2P preflight result.*

If the organisation already has a registered business brand, inspect that identity before creating another. Otherwise complete **Business information** with the real legal business name, business type, industry, tax identifier where requested, contact email and business website. Complete **Business address** and the authorised representative's first and last name, email, **Phone (E.164)**, job position and business title. These are organisation identity fields, not fictional lesson data to submit.

For our draft example, the campaign description could be “Cedar & Form customer support responses and requested order updates.” Choose the matching **Use case** from the actual form. In **Opt-in / message flow**, describe the real mechanism by which the customer agrees to receive these messages, including the actual page or form if used. Do not copy a sample claim about a booking checkbox if that checkbox does not exist on the business's site.

Provide two realistic **Sample message** values. A draft support sample is “Cedar & Form: we have received your lamp question and will reply here. Reply STOP to opt out.” A second could describe the actual order-update message the business will send. Samples should reflect the planned traffic, sender and response path. They are registration examples, not messages automatically delivered to a customer by typing them into this form.

Set **Messages contain links** and **Messages contain phone numbers** to match the actual traffic described by the samples. A product-page link in our draft means the links declaration must agree with it.

Review **Opt-in keywords** and **Opt-in reply**, **Opt-out keywords** and **Opt-out reply**, and **Help keywords** and **Help reply**. The form offers defaults such as START/YES and STOP/UNSUBSCRIBE. Make the replies identify the real business and a usable help route. These registration declarations should agree with the SMS response flow we configure later; contradictory descriptions make the operation difficult to review and diagnose.

Click **Check before submitting**. Inspect both blocking problems and warnings, including messages attached to particular fields. Correct the underlying detail and recheck. A website or message-flow problem is not repaired by merely dismissing its banner. If the form offers to create required site pages, review the resulting pages and their content on the actual site before claiming that they describe your operation accurately.

When the organisation's real information and intended use are ready, click **Submit A2P Registration**. Read the result carefully: a submitted brand or campaign can still be waiting for another stage. Use the status refresh control and **SMS Registration** timeline to inspect progress. **Fix and resubmit** is the recovery route when a correctable registration issue is returned. Keep the rejection detail connected to the field you change so the next submission has a clear reason to differ.

Saving a form, passing preflight and submitting a request are separate from provider/carrier approval. Registration status is also separate from a particular message's delivery result. Once the line is eligible in Appmint, perform one controlled, consented exchange and inspect both the Messages log and the receiving device. If a message fails, retain its actual status/error and inspect sender eligibility before editing the SMS routing logic.

The product lesson ends with a truthful state: registration information prepared, problems corrected, submitted/pending/approved status read accurately, and delivery checked independently when service is ready. Do not label a pending submission as an active texting service simply because the form closed successfully.
