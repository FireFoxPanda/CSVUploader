public with sharing class csvUploaderController {
  @AuraEnabled(Cacheable=true)
  public static List<Account> getData() {
    return [
      SELECT Id, Name, Industry, Type, Phone, Rating, AccountNumber
      FROM Account
      ORDER BY Name
      LIMIT 20
    ];
  }
}
