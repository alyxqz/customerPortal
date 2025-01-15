/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
 define(['N/record'], function(record) {

    function getInputData() {
        var customerSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: [
                ['custentity_cpptoken', search.Operator.ISEMPTY, '']
            ],
            columns: [
                search.createColumn({ name: 'internalid', label: 'Internal ID' }),
                search.createColumn({ name: 'entityid', label: 'Customer Name' })
            ]
        });
        return customerSearch
    }

    function map(context) {
        let result =JSON.parse(context.value)
        var rand =function(){
            return Math.random().toString(36).substr(2);
        }
        var token =function() {
            return rand() +rand()
        }
        let updatedRecordId =record.submitFields({
          type:result.recordType, id:result.id, values:{'custentity_cpp_token': token()}
        })
        log.debug('result', result.id)
        context.write({key: result.id, value: updatedRecordId})
    }

    function summarize(summary) {
        let totalRecs =0

        summary.output.iterator().each((key, value)=>{
           log.debug('keys', {'key': key, 'value':value})
           totalRecs +=1
           return true
       })
       log.debug('totalRecs', totalRecs)
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    }
});