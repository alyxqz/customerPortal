/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/email', 'N/record', 'N/log', 'N/url', 'N/runtime'], 
    function(email, record, log, url, runtime) {

    function afterSubmit(context) {
        try {
            if (context.type !== context.UserEventType.CREATE) return; // Only trigger on creation

            var invoiceRecord = context.newRecord;

            // Get the customer's email address from the invoice record
            var customerId = invoiceRecord.getValue('entity'); // Customer field ID
            var customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });
            var customerEmail = customerRecord.getValue('email');

            if (customerEmail) {
                
                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_my_suitelet', // Replace with your Suitelet script ID
                    deploymentId: 'customdeploy_my_suitelet', // Replace with your Suitelet deployment ID
                    returnExternalUrl: true // Set to true for an external URL, false for an internal URL
                });
        
                // Prepare email details
                var invoiceId = invoiceRecord.getValue('tranid'); // Invoice number
                var invoiceAmount = invoiceRecord.getValue('total'); // Invoice total
                var slToken = invoiceRecord.getValue('sltoken'); // Invoice total
                var companyName = customerRecord.getValue('companyname') || "Valued Customer"; // Company or Customer Name

                var portalURl =suiteletUrl +'&tkn='+ slToken
                
                // Define the HTML template
                var htmlBody = `
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .email-container { max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px; }
                            .header { background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; }
                            .content { padding: 20px; }
                            .footer { font-size: 0.9em; color: #777; text-align: center; padding: 10px; }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <div class="header">
                                <h1>New Invoice Created</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${companyName},</p>
                                <p>We are pleased to inform you that a new invoice has been created:</p>
                                <p><strong>Invoice Number:</strong> ${invoiceId}</p>
                                <p><strong>Amount:</strong> $${parseFloat(invoiceAmount).toFixed(2)}</p>
                                <p>Please review the invoice details <a href="${portalURl}">here</p>
                                <p>Thank you for your business!</p>
                            </div>
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                // Send email
                email.send({
                    author: runtime.getCurrentUser().id, // Current user as sender
                    recipients: customerEmail,
                    subject: `Invoice ${invoiceId} Created`,
                    body: htmlBody,
                    relatedRecords: {
                        transactionId: invoiceRecord.id
                    }
                });

                log.debug('Email Sent', 'Invoice email sent to ' + customerEmail);
            } else {
                log.debug('No Email Address Found', 'No email address found for customer ID ' + customerId);
            }
        } catch (e) {
            log.error('Error Sending Email', e.message);
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});
