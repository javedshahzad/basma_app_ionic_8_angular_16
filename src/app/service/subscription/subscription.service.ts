import { EventEmitter, Injectable,NgZone } from '@angular/core';
import {DataService} from '../data/data.service';
import { environment } from '../../../environments/environment';
import { ModalController, Platform} from "@ionic/angular";
import { Router } from '@angular/router';
import "cordova-plugin-purchase/www/store";
import { PlanReceiptComponent } from '../../plan-receipt/plan-receipt.component';
import { FcmService } from '../fcm.service';
import { StorageService } from '../storage.service';
import { PlanApiService } from '../plan-api/plan-api.service';
const env = environment; 

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
    productMothly: any;
    productYearly: any;
    productStatus:any;
    isExpired:any;
    isPurchased:any=[];
    userDetails:any;
    paymentDone=false;
    // DO NOT initialize to CdvPurchase.store here
    iap2?: CdvPurchase.Store;
         
    public products_2: any[] = [];
public products_ios_2 = [
     
      // {
      //     id:'apple.yearlySubscription.com',
      //     platform : CdvPurchase.Platform.APPLE_APPSTORE,
      //     type: CdvPurchase.ProductType.CONSUMABLE
      // },
       {
          id:'apple.monthlySubscription.com',
          platform : CdvPurchase.Platform.APPLE_APPSTORE,
          type: CdvPurchase.ProductType.CONSUMABLE
      },
      {
        id:'apple.adminmonthlysubscribe.com',
        platform : CdvPurchase.Platform.APPLE_APPSTORE,
        type: CdvPurchase.ProductType.CONSUMABLE
    },
    {
        id:'apple.basma.yearlySubscription.com',
        platform : CdvPurchase.Platform.APPLE_APPSTORE,
        type: CdvPurchase.ProductType.CONSUMABLE
    },
    {
      id:'apple.adminyearlysubscription.com',
      platform : CdvPurchase.Platform.APPLE_APPSTORE,
      type: CdvPurchase.ProductType.CONSUMABLE
    },
];


public products = [
// {
//     id:'test_product',
//     price:'1.99',
//     billingPeriod:1,
//     billingPeriodUnit:'month',
//     appleProductId:'',
//     googleProductId:'test_product',
//     type: '',
// },
{
    id:'com.monthlysubscribe.com',
    price:'14.99',
    billingPeriod:1,
    billingPeriodUnit:'month',
    appleProductId:'',
    googleProductId:'com.monthlysubscribe.com',
    type: 'monthly'
},
{
  id:'com.adminmonthlysubscribe.com',
  price:'24.99',
  billingPeriod:1,
  billingPeriodUnit:'month',
  appleProductId:'',
  googleProductId:'com.adminmonthlysubscribe.com',
  type: 'monthly',
},
{
  id:'com.yearlysubscription.com',
  price:'94.99',
  billingPeriod:1,
  billingPeriodUnit:'year',
  appleProductId:'',
  googleProductId:'com.yearlysubscription.com',
  type: 'yearly'
},
{
  id:'com.adminyearlysubscription.com',
  price:'139.99',
  billingPeriod:1,
  billingPeriodUnit:'year',
  appleProductId:'',
  googleProductId:'com.adminyearlysubscription.com',
  type: 'yearly'
}
];
public products_ios = [
{
    id:'apple.monthlySubscription.com',
    price:'14.99',
    billingPeriod:1,
    billingPeriodUnit:'month',
    appleProductId:'apple.monthlySubscription.com',
    googleProductId:'com.monthlysubscribe.com',
    type: 'monthly',
},
{
  id:'apple.adminmonthlysubscribe.com',
  price:'24.99',
  billingPeriod:1,
  billingPeriodUnit:'month',
  appleProductId:'apple.adminmonthlysubscribe.com',
  googleProductId:'com.monthlysubscribe.com',
  type: 'monthly',
},
{
    id:'apple.basma.yearlySubscription.com',
    price:'94.99',
    billingPeriod:1,
    billingPeriodUnit:'year',
    appleProductId:'apple.basma.yearlySubscription.com',
    googleProductId:'com.yearlysubscription.com',
    type: 'yearly'
},
{
  id:'apple.adminyearlysubscription.com',
  price:'139.99',
  billingPeriod:1,
  billingPeriodUnit:'year',
  appleProductId:'apple.adminyearlysubscription.com',
  googleProductId:'com.adminyearlysubscription.com',
  type: 'yearly'
}
];



	constructor(
				private dataService:DataService,
				private platform: Platform,
        private router:Router,
        private fcmService:FcmService,
        private modalController:ModalController,
        public zone:NgZone,
        private storageSr: StorageService,
        private planApi: PlanApiService) {

            this.platform.ready().then(async () => {
              const userData = await this.storageSr.get("userloggedin");
              if (userData) {
                this.userDetails = userData;
                //this.setup();
              }

            })
        }

   

 setup() {
     console.log('callSetup');
    if (this.platform.is('ios')) {
     this.iap2 = CdvPurchase.store
     // this.iap2.verbosity = this.iap2.log;
     this.iap2.verbosity = CdvPurchase.LogLevel.DEBUG;
      this.iap2.register(this.products_ios_2);
      this.iap2.initialize();
      this.iap2.update();
      this.iap2.restorePurchases();
    } else if (this.platform.is('android')) {
      this.products_2 = [
        // {
        //     id:'test_product',
        //     platform : CdvPurchase.Platform.GOOGLE_PLAY,
        //     type: CdvPurchase.ProductType.NON_CONSUMABLE
        // },
        {
            id:'com.monthlysubscribe.com',
            platform : CdvPurchase.Platform.GOOGLE_PLAY,
            type: CdvPurchase.ProductType.NON_CONSUMABLE
        },
        {
          id:'com.adminmonthlysubscribe.com',
          platform : CdvPurchase.Platform.GOOGLE_PLAY,
          type: CdvPurchase.ProductType.NON_CONSUMABLE
        },
        {
          id:'com.yearlysubscription.com',
          platform : CdvPurchase.Platform.GOOGLE_PLAY,
          type: CdvPurchase.ProductType.NON_CONSUMABLE
        },
        {
          id:'com.adminyearlysubscription.com',
          platform : CdvPurchase.Platform.GOOGLE_PLAY,
          type: CdvPurchase.ProductType.NON_CONSUMABLE
        },
  
  ]
     this.iap2 = CdvPurchase.store
     // this.iap2.verbosity = this.iap2.log;
     this.iap2.verbosity = CdvPurchase.LogLevel.DEBUG;
      this.iap2.register(this.products_2);
      this.iap2.initialize();
      this.iap2.update();
      this.iap2.restorePurchases();
    }
  }

  checkoutSSS(p: any, PlanData?: any) {
    this.fcmService.getPlan.next(true);
  }
  checkout(p: any, PlanData?: any) {
      this.dataService.showLoading();
      let productId;
      let pData={};
        if (this.platform.is('ios')) {
                productId = this.products_ios[p].appleProductId;
                pData={
                      id:this.products_ios[p].id,
                      price:this.products_ios[p].price,
                      billingPeriod:this.products_ios[p].billingPeriod,
                      billingPeriodUnit:this.products_ios[p].billingPeriodUnit
                }
            } else if (this.platform.is('android')) {
              
                productId = this.products_2[p].id;
                pData={
                    id:this.products[p].id,
                    price:this.products[p].price,
                    billingPeriod:this.products[p].billingPeriod,
                    billingPeriodUnit:this.products[p].billingPeriodUnit
                }
                console.log('productId',pData , "pp data"  ,  PlanData);
                // this.subcribeToServer('transaction.products[0]',pData,PlanData);
            }
           console.log('productId',productId);
          
    try {
      let product = this.iap2.get(productId).getOffer().order().then((p) => {
        this.dataService.hideLoading();
      console.log('Purchase Succesful' + JSON.stringify(p));
    }).catch((e) => {
        // this.dataService.showToast('Error Ordering From Store')
        this.dataService.hideLoading();
      console.log('Error Ordering From Store' + e);
    });
      console.log('Product Info: ' ,product);
      // this.iap2.order(productId).then((p) => {
      //     this.dataService.hideLoading();
      //   console.log('Purchase Succesful' + JSON.stringify(p));
      // }).catch((e) => {
      //     // this.dataService.showToast('Error Ordering From Store')
      //     this.dataService.hideLoading();
      //   console.log('Error Ordering From Store' + e);
      // });
      this.registerHandlersForPurchase(productId,pData,PlanData);
    } catch (err) {
        // this.dataService.showToast('Error Ordering From Store')
        this.dataService.hideLoading();
        console.log('Error Ordering ' + JSON.stringify(err));
    }
  }
  registerHandlersForPurchase(productId: any, pData: any, PlanData?: any) {
    this.iap2.when().approved((transaction) => {
      console.log("transaction == ",transaction)
      if (transaction.products && transaction.products[0] && transaction.products[0].id === productId) {
          transaction.finish();
          transaction.verify();
          if(this.platform.is('android')){
            this.subcribeToServer(transaction.products[0],pData,PlanData);
          }else{
            this.purchaseToServer(transaction,pData,PlanData);
          }
      }
  });

   
  }

  
  subcribeToServer(subs: any, pData: any, PlanData: any){
       var receipt =JSON.parse(subs.transaction.receipt);
          let data={
              plan_id: PlanData.id,
              iap_id:receipt.orderId,
              paymentType:subs.transaction.type,
              billingPeriod:pData.billingPeriod,
              billingPeriodUnit:pData.billingPeriodUnit,
              ammount:pData.price,
              user_id:this.userDetails.details.user_no,
              school:this.userDetails.details.school_id
          }
            console.log(data, "dattaaaa")
          this.planApi.purchase(data).then(res=>{
              this.paymentDone=true;
                this.fcmService.getPlan.next(true);
              this.showreceiptModal(PlanData,receipt);
              this.iap2.refresh();

          },e=>{
              this.dataService.showToast('Error in processing payment');
          })

  }

    purchaseToServer(subs: any, pData: any, PlanData: any){
        var receipt = subs;
        console.log("receipt === ",receipt)
          let data={
              plan_id: PlanData.id,
              iap_id:receipt.transactionId,
              paymentType:receipt.platform,
              billingPeriod:pData.billingPeriod,
              billingPeriodUnit:pData.billingPeriodUnit,
              ammount:pData.price,
              user_id:this.userDetails.details.user_no,
              school:this.userDetails.details.school_id
          }
          console.log(data, "dattaaaa")
          this.planApi.purchase(data).then(res=>{
              this.paymentDone=true;
              this.dataService.showToast('Plan subscribed Successfully');
                this.fcmService.getPlan.next(true);
              this.showreceiptModal(PlanData,receipt);
              this.iap2.refresh();
           

          },e=>{
              this.dataService.showToast('Error in processing payment');
          })

  }


  // paymentStatus(pid?,callback?){
  //   let productId;
  //   if (this.platform.is('ios')) {
  //     productId = this.products_ios[pid].appleProductId;
  //     this.iap2.when(productId).approved(p => p.verify()).verified(p => p.finish());
  //   } else if (this.platform.is('android')) {
  //     productId = this.products[pid].googleProductId;
  //   }
    
  //   this.iap2.refresh();
  //   callback(true);
  // }





  async showreceiptModal(selectedPlan: any, receipt: any){
    const modal = await this.modalController.create({
      component: PlanReceiptComponent, // Replace with your modal component
      mode:"ios",
      backdropDismiss: false, 
      cssClass: 'plan-receipt-modal', // Add a custom class for styling
      componentProps: {
        selectedPlan:JSON.stringify(selectedPlan),
        receipt:JSON.stringify(receipt),
        isSuccess:true
      },
      
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
      if (data) {
        
        console.log("PlanReceiptComponent Data = ",data)
        if(data.isDone){
          this.router.navigate(['/tabs/classlist'])
        } 
      }
  }






  doPaypalPayment(data:any): Promise<any> {
    return new Promise((resolve, reject) => {
			   resolve('true');
			  })
	}
}