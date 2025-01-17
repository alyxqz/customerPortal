# Customer Payment Portal Suitelet

This Suitelet provides a secure portal for customers to view open invoices and make payments. The script dynamically generates the portal based on customer-specific data generated from Netsuite and uses [Authorize.net](https://developer.authorize.net/api/reference/index.html) as a payment gateway

---

## **Features**

- **Token-based Authentication**: Secure access using customer-specific tokens.
- **Manage Invoices**: Fetches and displays all open invoices for the authenticated customer.
- **Payment Processing**: Supports credit card (CC) and ACH payment methods.
- **Dynamic Templates**: Uses HTML templates for portal and response pages.
- **PDF Generation**: Generates downloadable PDF files for processed payments.
- **Payment History Logging**: Logs every payment attempt for auditing.

## **Installation**

### **1. Upload Files**
1. Navigate to **Customization > Scripts > SuiteScripts** in your NetSuite account.
2. Upload the following files:
   - Main Suitelet script (`customerPaymentPortal.js`,`tokenGenerator.js`, `InvoiceEmails.js`).
   - Library scripts (e.g., `authNet.js`) or any Third Party Payment Gateway API
   - `config.json` for constants.
   - HTML templates for portal and response pages.

### **2. Create a Script Record**
1. Go to **Customization > Scripts > Scripts**.
2. Click **New Script** and choose **Suitelet**.
3. Upload the Suitelet script and save.

### **3. Deploy the Script**
1. Navigate to **Customization > Scripts > Script Deployment**.
2. Deploy the Suitelet script.
3. Set the deployment status to **Released**.
4. Configure **Available Without Login** if external access is required.

### **4. Configure `config.json`**
Update the `config.json` file with your account-specific settings:

```json
{
  "HTML_TEMPLATE_ID": "123456",
  "RESPONSE_TEMPLATE_ID": "123457",
  "FOLDER_ID": "456789",
  "SUBSIDIARY_EMAILS": {
    "23": "billing@company1.com",
    "40": "accounting@company2.com",
    "26": "accountsreceivable@company3.com"
  },
  "SUBSIDIARY_LOGOS": {
    "23": "https://example.com/logo1.png",
    "40": "https://example.com/logo2.png",
    "26": "https://example.com/logo3.png"
  }
}
```
## Generate Customer Tokens

### Create NetSuite Custom Field

1. **Navigate**: 
    - Go to **Customization > List, Records & Fields >  Entity Fields**

2. **Create New Fields**: 
    - Enter field name (ex. `slToken`)
    - Type: TEXT
    - Applies To: **Customer**

### Create Token

3. Navigate to tokenGenerator script page:
    1. **Deploy Script**:  
        - Choose recurring for Sch Type
        - Set frequency to every 15 mins

    2. **Run `tokenGenerator.js` Map Reduce**: 
        - Customer Records will be populated with unique a token used to access inovoices.

##### SuiteletURL
Customer will automaticallly recieve a new email with a link to the Portal.

Alternatively, you can generate the PortalURL using this synaxtical structure
```javascript
let portalURL = SuiteletURL +'&tkn='+ slToken
```

#### Payload Structure

1. **Root Object**
    - Contains two main sections: `payload` and `paymentMethod`.

2. **`payload`**: Holds invoice data.
    - **`invoiceId`**: Unique identifier of the invoice.
    - **`amount`**: Payment amount applied to the invoice.

3. **`paymentMethod`**: Contains details about the payment method.
    - **`type`**: Payment type (`cc` or `ach`).
    - **Credit Card Fields**:
        - `ccnum`, `expDate`, `ccv`.
    - **ACH Fields**:
        - `achnum`, `routing`, `achname`.

4. **Other Fields**:
    - **`numTotal`**: Total transaction amount.
    - **`entityid`**: Customer identifier.

---

Once this payload is transmitted, **Authorize.net** will validate the payment securly  and store any sensitive customer data. NetSuite will receive a correesponding Customer Payment/Receipt. 

**NetSuite** will not store any sensitive Credit Card or ACH data.

## Examples

### 1. Manage Invoices
Get customer specifc data from NetSuite and allow users to manage open invoices for payment via tokenized suitelet

![Manage Invoices](https://i.imgur.com/R8AY3Vo.png)


### 2. Manage Payment Methods
Allow customers to maintain (Update, Edit, Delete) Credit Card and ACH specific data.
![Manage Payment Methods](https://i.imgur.com/rgZ1hvu.png)


### 3. Download/Print Receipts
Print Open invoices from NetSuite to review and download payment receipts when payments is validated.
![Download/Print Receipts](https://i.imgur.com/dsbjRLu.png)

---
