/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @NAmdConfig /SuiteScripts/config.json
 */

define(['N/file', 'N/record', 'N/search', 'N/render', './lib/authNet', './config/constants'], 
function(file, record, search, render, authNet, constants) {

    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                handleGetRequest(context);
            } else if (context.request.method === 'POST') {
                handlePostRequest(context);
            }
        } catch (error) {
            log.error({ title: 'Error in onRequest', details: error });
            context.response.write(`<p>An error occurred: ${error.message}</p>`);
        }
    }

    // Handle GET requests
    function handleGetRequest(context) {
        const token = context.request.parameters.tkn;
        if (!token) {
            throw new Error('Invalid access: Token is missing.');
        }

        const customerData = fetchCustomerData(token);
        const invoices = fetchOpenInvoices(customerData.entityId);
        const template = loadHTMLTemplate();
        const populatedTemplate = populateTemplate(template, {
            companyName: customerData.companyName,
            entityId: customerData.entityId,
            email: constants.SUBSIDIARY_EMAILS[customerData.subsidiary],
            linevalue: JSON.stringify(invoices),
            pdfs: JSON.stringify(fetchInvoicePDFs(invoices)),
            logo: constants.SUBSIDIARY_LOGOS[customerData.subsidiary],
            address: customerData.address
        });

        context.response.write(populatedTemplate);
    }

    // Handle POST requests
    function handlePostRequest(context) {
        const params = context.request.parameters;
        const payload = JSON.parse(params.payload);
        const paymentMethod = JSON.parse(params.paymentMethod);

        const token = processPayment(payload, paymentMethod, params);
        saveCustomerPayment(params.entityid, payload, token);

        const template = loadResponseTemplate();
        const responseHTML = populateTemplate(template, {
            orderTotal: params.numTotal,
            logo: constants.SUBSIDIARY_LOGOS[params.sub],
            pdfurl: generatePDF(params.entityid)
        });

        context.response.write(responseHTML);
    }

    // Fetch customer data
    function fetchCustomerData(token) {
        const customerSearch = search.create({
            type: 'customer',
            filters: [['custentity_cpp_token', 'is', token]],
            columns: ['entityid', 'subsidiary', 'companyname', 'address']
        });

        const result = customerSearch.run().getRange({ start: 0, end: 1 })[0];
        if (!result) {
            throw new Error('Invalid Token: No customer found.');
        }

        return {
            entityId: result.getValue('entityid'),
            subsidiary: result.getValue('subsidiary'),
            companyName: result.getValue('companyname'),
            address: result.getValue('address')
        };
    }

    // Fetch open invoices
    function fetchOpenInvoices(entityId) {
        const invoiceSearch = search.create({
            type: 'invoice',
            filters: [
                ['entity', 'is', entityId],
                'AND',
                ['status', 'anyof', 'CustInvc:A'],
                'AND',
                ['mainline', 'is', 'T']
            ],
            columns: ['tranid', 'amount', 'trandate']
        });

        return invoiceSearch.run().getRange({ start: 0, end: 100 }).map(result => ({
            tranId: result.getValue('tranid'),
            amount: result.getValue('amount'),
            tranDate: result.getValue('trandate')
        }));
    }

    // Fetch PDFs for invoices
    function fetchInvoicePDFs(invoices) {
        return invoices.map(invoice => generatePDF(invoice.tranId));
    }

    // Generate PDF for a transaction
    function generatePDF(transactionId) {
        const pdfFile = render.transaction({
            entityId: transactionId,
            printMode: render.PrintMode.PDF
        });
        pdfFile.folder = constants.FOLDER_ID;
        const fileId = pdfFile.save();

        const fileSearch = search.create({
            type: 'file',
            filters: [['internalid', 'is', fileId]],
            columns: ['url']
        });

        const result = fileSearch.run().getRange({ start: 0, end: 1 })[0];
        return result ? result.getValue('url') : null;
    }

    // Process payment
    function processPayment(payload, paymentMethod, params) {
        if (paymentMethod.type === 'cc') {
            return processCreditCard(paymentMethod);
        } else if (paymentMethod.type === 'ach') {
            return processACH(paymentMethod);
        } else {
            throw new Error('Unsupported payment method.');
        }
    }

    // Process credit card
    function processCreditCard(paymentMethod) {
        // Logic for credit card processing
        var expDate =params.expDate
        var ccv =params.ccv
        var gtwy =params.gateway
        log.debug('gtwy', gtwy)
        var b_goodcvv = ccv.length <= 4 && ccv.length > 2;
        if (!b_goodcvv) {
            throw(' Invalid CVV Format - must be 3 or 4 numbers');
        }
        var o_ccTypes = {
            3 : 'Amex',
            4 : 'Visa',
            5 : 'Master Card',
            6 : 'Discover'
        };
        var cardNum = params.ccnum;
        var b_goodCard;
        if ((_.includes([4, 5, 6], +cardNum[0]) && cardNum.length === 16)) {
                b_goodCard = true;
        } else if (+cardNum[0] === 3 && cardNum.length >= 15){
            b_goodCard = true;
        } else {
            b_goodCard = false;
        }
        if (!b_goodCard)
        {
            throw ('Invalid Card Number - recheck this ' + o_ccTypes[cardNum[0]]);
        }

        rec =record.create({type:'customrecord_authnet_tokens'})
        rec.setValue('custrecord_an_token_entity', params.entityid)
        rec.setValue('custrecord_an_token_gateway', 1)
        rec.setValue('custrecord_an_token_paymenttype', 1)
        rec.setValue('custrecord_an_token_name_on_card', params.name)
        rec.setValue('custrecord_an_token_cardnumber', cardNum)
        rec.setValue('custrecord_an_token_expdate', expDate)
        rec.setValue('custrecord_an_token_cardcode', ccv)
        rec.setValue('custrecord_an_token_customer_type', 'business')
        // rec.setValue('custrecord_an_token_entity_email', params.email)
    
        rec.setValue('custrecord_an_token_uuid', authNet.buildUUID())
      
        var o_config = authNet.getConfigFromCache(+rec.getValue({fieldId: 'custrecord_an_token_gateway'}));
        
        var new_config =authNet.getConfigFromCache()
        log.debug('o_config', o_config)
        log.debug('sub', params.sub)

        var gtwy =params.sub ==40? 2: 1
        if (new_config.mode === 'subsidiary'){
            new_config = authNet.getSubConfig(params.sub, new_config);
        }
        var o_newProfile = authNet.createNewProfile(rec, new_config);
        log.debug(o_newProfile)
    
        if (!o_newProfile.success){
            //build link to the history record for reference
            var historyURL = url.resolveRecord({
                recordType: 'customrecord_authnet_history',
                recordId: o_newProfile.histId,
                isEditMode: false
            });
            var s_error = 'Unable to validate payment method - error received:<br>'+
                'CODE : '+ o_newProfile.code + '<br>' +
                'MESSAGE : ' +o_newProfile.message + '<br>' + 'Click <a href="'+historyURL+'" target="_blank">here</a> to view the Authorize.Net Response if you need additional information.'
            throw s_error;
        }
        rec.setValue('custrecord_an_token_gateway_sub', gtwy)
        rec.setValue('custrecord_an_token_subsidiary', params.sub)
        rec.setValue('custrecord_an_token_customerid', o_newProfile.customerProfileId)
        rec.setValue('custrecord_an_token_token', o_newProfile.customerPaymentProfileIdList[0])
        rec.setValue({fieldId: 'custrecord_an_token_type', value : o_newProfile.creditCard.cardtype});
        rec.setValue({fieldId: 'custrecord_an_token_last4', value : o_newProfile.creditCard.cardnum});
        rec.setValue({fieldId: 'name', value : o_newProfile.creditCard.cardtype + ' ('+o_newProfile.creditCard.cardnum+')'});
        var tokenid =rec.save()
          
        return tokenid; // Mocked response
    }

    // Process ACH
    function processACH(paymentMethod) {
        rec =record.create({type:'customrecord_authnet_tokens'})
        rec.setValue('custrecord_an_token_entity', _.trim(params.entityid))
        rec.setValue('custrecord_an_token_gateway', 1)
        rec.setValue('custrecord_an_token_paymenttype', 2)
        rec.setValue('custrecord_an_token_bank_accounttype', _.trim(params.acctype))
        rec.setValue('custrecord_an_token_bank_bankname', _.trim(params.achbank))
        rec.setValue('custrecord_an_token_customer_type', 'business')
        rec.setValue('custrecord_an_token_bank_accountnumber', _.trim(params.achnum))
        rec.setValue('custrecord_an_token_bank_nameonaccount', _.trim(params.achname))
        rec.setValue('custrecord_an_token_bank_routingnumber', _.trim(params.routing))
        
        rec.setValue('custrecord_an_token_uuid', authNet.buildUUID())
        
        var o_config = authNet.getConfigFromCache(+rec.getValue({fieldId: 'custrecord_an_token_gateway'}));
        log.debug('o_config', o_config)
    
        var new_config =authNet.getConfigFromCache()
        log.debug('o_config', o_config)
        log.debug('sub', params.sub)
      
        var gtwy =params.sub ==40? 2: 1
        if (new_config.mode === 'subsidiary'){
            new_config = authNet.getSubConfig(params.sub, new_config);
        }
        
        var o_newProfile = authNet.createNewProfile(rec, new_config);
        log.debug(o_newProfile)
    
        if (!o_newProfile.success){
            //build link to the history record for reference
            var historyURL = url.resolveRecord({
                recordType: 'customrecord_authnet_history',
                recordId: o_newProfile.histId,
                isEditMode: false
            });
            var s_error = 'Unable to validate payment method - error received:<br>'+
                'CODE : '+ o_newProfile.code + '<br>' +
                'MESSAGE : ' +o_newProfile.message + '<br>' + 'Click <a href="'+historyURL+'" target="_blank">here</a> to view the Authorize.Net Response if you need additional information.'
            throw s_error;
        }
        rec.setValue('custrecord_an_token_gateway_sub', gtwy)
        rec.setValue('custrecord_an_token_subsidiary', params.sub)
        rec.setValue('custrecord_an_token_customerid', o_newProfile.customerProfileId)
        rec.setValue('custrecord_an_token_token', o_newProfile.customerPaymentProfileIdList[0])
        rec.setValue({fieldId: 'custrecord_an_token_type', value : o_newProfile.bankAccount.accountType});
        rec.setValue({fieldId: 'custrecord_an_token_last4', value : o_newProfile.bankAccount.accountNum});
        rec.setValue({fieldId: 'name', value : o_newProfile.bankAccount.accountType + ' ('+o_newProfile.bankAccount.accountNum+')'});
        var tokeid =rec.save()  
        

        return tokeid
        'ACH-TOKEN-456'; // Mocked response
    }
    
    //send request without saving users Credit Card info
    function proccessCCNoSave(params){
        var payment =params.tranid
        var new_config =authNet.getConfigFromCache()
        var gtwy =params.sub ==40? 2: 1

        if (new_config.mode === 'subsidiary'){
            new_config = authNet.getSubConfig(params.sub, new_config);
        }
        let payload =params.payload
        var paymentMethod =JSON.parse(params.paymentMethod)

        log.debug('payloadnosave', payload)
        log.debug('paymentMethod', paymentMethod)
        log.debug('gtwy', gtwy)

        let trankey =new_config.custrecord_an_trankey_sb.val
        //let trankey =new_config.custrecord_an_trankey.val
        let apiLogin =new_config.custrecord_an_login_sb.val
        //let apiLogin =new_config.custrecord_an_login.val
        
        log.debug('newconfig', trankey)
        log.debug('newconfig', new_config)
        log.debug('newconfig', apiLogin)    
        log.debug('subconfig', params.sub)
        log.debug('ccparams', params)

        let chargeCard = {
            "createTransactionRequest": {
                "merchantAuthentication": {
                    "name": apiLogin,          // API login ID
                    "transactionKey": trankey  // API transaction key
                },
                "refId": params.refid,         // Reference ID for the transaction
                "transactionRequest": {
                    "transactionType": "authCaptureTransaction", // Transaction type (e.g., authorize and capture)
                    "amount": params.numTotal,  // Total transaction amount
                    "payment": {
                        "creditCard": {         // Credit card details for payment
                            "cardNumber": paymentMethod.ccnum,
                            "expirationDate": paymentMethod.expDate,
                            "cardCode": paymentMethod.ccv
                        }
                    },
                    "order": {
                        "invoiceNumber": payment,  // Invoice number associated with the transaction
                        "description": params.entity + ' customerPayment', // Description of the transaction
                        "discountAmount": 0.0,     // Discounts applied (if any)
                        "taxIsAfterDiscount": false // Indicates whether tax is calculated after discounts
                    }
                }
            }
        };
        
        
        try{
            var response = https.post({
                headers: {'Content-Type': 'application/json'},
                url: new_config.authSvcUrl,
                body: JSON.stringify(chargeCard)
            });

            log.debug('response', response)
        }catch(e){
            log.debug('responseERROR', e)
        }

        return {'response': response, 'config': new_config}
    }

    // Save customer payment
    function saveCustomerPayment(entityId, payload, token) {
        const payment = record.create({ type: record.Type.CUSTOMER_PAYMENT, isDynamic: true });
        payment.setValue('customer', entityId);
        payment.setValue('custbody_authnet_cim_token', token);

        payload.forEach(({ invoiceId, amount }) => {
            const line = payment.findSublistLineWithValue('apply', 'internalid', invoiceId);
            payment.selectLine({ sublistId: 'apply', line });
            payment.setCurrentSublistValue('apply', 'amount', amount);
        });

        payment.save();
    }

    // Load HTML template
    function loadHTMLTemplate() {
        const fileObj = file.load({ id: constants.HTML_TEMPLATE_ID });
        return fileObj.getContents();
    }

    // Load response template
    function loadResponseTemplate() {
        const fileObj = file.load({ id: constants.RESPONSE_TEMPLATE_ID });
        return fileObj.getContents();
    }

    // Populate template with data
    function populateTemplate(template, data) {
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            template = template.replaceAll(placeholder, data[key]);
        });
        return template;
    }

    return { onRequest };
});
