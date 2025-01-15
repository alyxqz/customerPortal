/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
 define(['N/record'], function(record) {

    function getInputData() {
        return {type:'search', id: 'customsearch1830'}
    }

    function map(context) {
        let result =JSON.parse(context.value)
        var rand =function(){
            return Math.random().toString(36).substr(2);
        }
        var token =function() {
            return rand() +rand()
        }
        //let customer =record.load({type:result.recordType, id: result.id})
        //customer.setValue('custentity_cpp_token', token())
        //customer.save()
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