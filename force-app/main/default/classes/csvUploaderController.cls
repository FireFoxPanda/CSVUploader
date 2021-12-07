public without sharing class csvUploaderController {
  @AuraEnabled(Cacheable=true)
  public static List<sobject> getData() {
    return [
      SELECT
        Id,
        Name,
        Industry,
        Type,
        Phone,
        Rating,
        AccountNumber,
        Data_Quality_Description__c
      FROM Account
      ORDER BY Name
    ];
  }

  @AuraEnabled(Cacheable=false)
  public static void updateData(List<sObject> recordList) {
    try {
      database.update(recordList);
    } catch (Exception e) {
      String errorMsg = e.getMessage();
      //  String pureErrorMsg = errorMsg.substringAfter('_EXCEPTION,');
      // pureErrorMsg = pureErrorMsg.Substring(0, (pureErrorMsg.length() - 4));
      throw new AuraHandledException(errorMsg);
    }
  }
}
