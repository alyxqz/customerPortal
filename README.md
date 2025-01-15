# Customer Payment Portal Suitelet

This Suitelet provides a secure portal for customers to view open invoices and make payments. The script dynamically generates the portal based on customer-specific data and integrates with NetSuite’s payment processing features.

---

## **Features**

- **Token-based Authentication**: Secure access using customer-specific tokens.
- **Invoice Display**: Fetches and displays all open invoices for the authenticated customer.
- **Payment Processing**: Supports credit card (CC) and ACH payment methods.
- **Dynamic Templates**: Uses HTML templates for portal and response pages.
- **PDF Generation**: Generates downloadable PDF files for processed payments.
- **Payment History Logging**: Logs every payment attempt for auditing.

---

## **Installation**

### **1. Upload Files**
1. Navigate to **Customization > Scripts > SuiteScripts** in your NetSuite account.
2. Upload the following files:
   - Main Suitelet script (`customerPaymentPortal.js`).
   - Library scripts (e.g., `authNet.js`).
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
