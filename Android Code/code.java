package com.podcastitmobile;

import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.SkuDetails;
import com.android.billingclient.api.SkuDetailsParams;
import com.android.billingclient.api.SkuDetailsResponseListener;

import static com.android.billingclient.api.BillingClient.SkuType.INAPP;

import java.io.IOException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class PurchaseActivity extends AppCompatActivity  implements PurchasesUpdatedListener {

    //public static final String PRODUCT_ID= "podcastit";
    enum ProductId{
        REMOVE_ADS("removeads"),
        EXTEND_VIDEO("extendvideotime"),
        GO_PREMIUM("gopremium");

        private final String text;

        ProductId(final String text) {
            this.text = text;
        }

        @Override
        public String toString() {
            return text;
        }
    }

    private BillingClient billingClient;
    private PurchaseVerifier purchaseVerifier;
    TextView lblPremiumPrice;
    TextView lblExtendVideoPrice;
    TextView lblRemoveAdsPrice;
    Button btnGoPremium;
    Button btnExtendVideo;
    Button btnRemoveAds;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        int orientation = getResources().getConfiguration().orientation;
        if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
            return;
        }

        setContentView(R.layout.activity_purchase3);

        purchaseVerifier = new PurchaseVerifier(getBaseContext());

        lblPremiumPrice = findViewById(R.id.lblPremiumPrice2);
        lblExtendVideoPrice = findViewById(R.id.lblExtendVideoPrice2);
        lblRemoveAdsPrice = findViewById(R.id.lblRemoveAdsPrice2);

        btnGoPremium = findViewById(R.id.btnGoPremium);
        btnExtendVideo = findViewById(R.id.btnExtendVideo);
        btnRemoveAds = findViewById(R.id.btnRemoveAds);

        // Establish connection to billing client
        //check purchase status from google play store cache
        //to check if item already Purchased previously or refunded
        billingClient = BillingClient.newBuilder(this).enablePendingPurchases().setListener(this).build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if(billingResult.getResponseCode()==BillingClient.BillingResponseCode.OK){
                    Purchase.PurchasesResult queryPurchase = billingClient.queryPurchases(INAPP);
                    List<Purchase> queryPurchases = queryPurchase.getPurchasesList();
                    setProductPrice();
                    if(queryPurchases!=null && queryPurchases.size()>0){
                        handlePurchases(queryPurchases);
                    }
                    //if purchase list is empty that means item is not purchased
                    //Or purchase is refunded or canceled
                    else{
                        purchaseVerifier.saveGoPremiumPurchaseValue(false);
                        purchaseVerifier.saveExtendVideoPurchaseValue(false);
                        purchaseVerifier.saveRemoveAdsPurchaseValue(false);
                    }
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
            }
        });

        if (purchaseVerifier.hasGoPremiumPurchased() ||
           (purchaseVerifier.hasExtendVideoPurchased() &&
            purchaseVerifier.hasRemoveAdsPurchased())) {
            setPurchaseStateFor(ProductId.GO_PREMIUM.toString());
        }
        else if (purchaseVerifier.hasExtendVideoPurchased()) {
            setPurchaseStateFor(ProductId.EXTEND_VIDEO.toString());
        }
        else if (purchaseVerifier.hasRemoveAdsPurchased()) {
            setPurchaseStateFor(ProductId.REMOVE_ADS.toString());
        }
    }


    public void goPremium(View view) {
// TEST PURPOSE ONLY
//        if (!purchaseVerifier.hasGoPremiumPurchased()) {
//            purchaseVerifier.saveGoPremiumPurchaseValue(true);
//            setPurchaseStateFor(ProductId.GO_PREMIUM.toString());
//        }

        purchaseIt(ProductId.GO_PREMIUM.toString());
    }

    public void removeAds(View view) {
// TEST PURPOSE ONLY
//        if (!purchaseVerifier.hasRemoveAdsPurchased()) {
//            purchaseVerifier.saveRemoveAdsPurchaseValue(true);
//            setPurchaseStateFor(ProductId.REMOVE_ADS.toString());
//        }

        purchaseIt(ProductId.REMOVE_ADS.toString());
    }

    public void extendVideoTime(View view) {
// TEST PURPOSE ONLY
//        if (!purchaseVerifier.hasExtendVideoPurchased()) {
//            purchaseVerifier.saveExtendVideoPurchaseValue(true);
//            setPurchaseStateFor(ProductId.EXTEND_VIDEO.toString());
//        }

        purchaseIt(ProductId.EXTEND_VIDEO.toString());
    }

    private void setPurchaseStateFor(String productId){

        int GREEN = 0xFF169745;

        if(productId.equals(ProductId.GO_PREMIUM.toString())){
            btnGoPremium.setEnabled(false);
            lblPremiumPrice.setText("Item Purchased!");
            lblPremiumPrice.setTextColor(GREEN);
            btnRemoveAds.setEnabled(false);
            lblRemoveAdsPrice.setText("Item Purchased!");
            lblRemoveAdsPrice.setTextColor(GREEN);
            btnExtendVideo.setEnabled(false);
            lblExtendVideoPrice.setText("Item Purchased!");
            lblExtendVideoPrice.setTextColor(GREEN);
        }
        if(productId.equals(ProductId.EXTEND_VIDEO.toString())){
            btnGoPremium.setEnabled(false);
            btnExtendVideo.setEnabled(false);
            lblExtendVideoPrice.setText("Item Purchased!");
            lblExtendVideoPrice.setTextColor(GREEN);
        }
        if(productId.equals(ProductId.REMOVE_ADS.toString())){
            btnGoPremium.setEnabled(false);
            btnRemoveAds.setEnabled(false);
            lblRemoveAdsPrice.setText("Item Purchased!");
            lblRemoveAdsPrice.setTextColor(GREEN);
        }
    }

    //initiate purchase on button click
    private void purchaseIt(String productId){
        //check if service is already connected
        if (billingClient.isReady()) {
            initiatePurchase(productId);
        }
        //else reconnect service
        else{
            billingClient = BillingClient.newBuilder(this).enablePendingPurchases().setListener(this).build();
            billingClient.startConnection(new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(BillingResult billingResult) {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        initiatePurchase(productId);
                    } else {
                        Toast.makeText(getApplicationContext(),"Error "+billingResult.getDebugMessage(),Toast.LENGTH_SHORT).show();
                    }
                }
                @Override
                public void onBillingServiceDisconnected() {
                }
            });
        }
    }

    private void initiatePurchase(String productId) {
        List<String> skuList = new ArrayList<>();
        skuList.add(productId);
        SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder();
        params.setSkusList(skuList).setType(INAPP);
        billingClient.querySkuDetailsAsync(params.build(),
                new SkuDetailsResponseListener() {
                    @Override
                    public void onSkuDetailsResponse(BillingResult billingResult,
                                                     List<SkuDetails> skuDetailsList) {
                        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            if (skuDetailsList != null && skuDetailsList.size() > 0) {
                                BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                                        .setSkuDetails(skuDetailsList.get(0))
                                        .build();

                                billingClient.launchBillingFlow(PurchaseActivity.this, flowParams);
                            }
                            else{
                                //try to add item/product id "purchase" inside managed product in google play console
                                Toast.makeText(getApplicationContext(),"Purchase Item not Found",Toast.LENGTH_SHORT).show();
                            }
                        } else {
                            Toast.makeText(getApplicationContext(),
                                    " Error "+billingResult.getDebugMessage(), Toast.LENGTH_SHORT).show();
                        }
                    }
                });
    }

    private void setProductPrice() {
        List<String> skuList = new ArrayList<>();
        skuList.add(ProductId.GO_PREMIUM.toString());
        skuList.add(ProductId.EXTEND_VIDEO.toString());
        skuList.add(ProductId.REMOVE_ADS.toString());
        SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder();
        params.setSkusList(skuList).setType(INAPP);
        billingClient.querySkuDetailsAsync(params.build(),
                new SkuDetailsResponseListener() {
                    @Override
                    public void onSkuDetailsResponse(BillingResult billingResult,
                                                     List<SkuDetails> skuDetailsList) {
                        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            if (skuDetailsList != null && skuDetailsList.size() > 0) {
                                if (!purchaseVerifier.hasGoPremiumPurchased()) {
                                    lblPremiumPrice.setText(getProductPrice(skuDetailsList, ProductId.GO_PREMIUM.toString()));
                                }
                                if (!purchaseVerifier.hasExtendVideoPurchased()) {
                                    lblExtendVideoPrice.setText(getProductPrice(skuDetailsList, ProductId.EXTEND_VIDEO.toString()));
                                }
                                if (!purchaseVerifier.hasRemoveAdsPurchased()) {
                                    lblRemoveAdsPrice.setText(getProductPrice(skuDetailsList, ProductId.REMOVE_ADS.toString()));
                                }
                            }
                        }

                    }
                });

    }

    private String getProductPrice(List<SkuDetails> skuDetailsList, String productId){
        for(SkuDetails skuDetails:skuDetailsList){
            if(skuDetails.getSku().equals(productId)){
                return skuDetails.getPrice();
            }
        }
        return "0.00";
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, @Nullable List<Purchase> purchases) {
        //if item newly purchased
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            handlePurchases(purchases);
        }
        //if item already purchased then check and reflect changes
        else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            Purchase.PurchasesResult queryAlreadyPurchasesResult = billingClient.queryPurchases(INAPP);
            List<Purchase> alreadyPurchases = queryAlreadyPurchasesResult.getPurchasesList();
            if(alreadyPurchases!=null){
                handlePurchases(alreadyPurchases);
            }
        }
        //if purchase cancelled
        else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            Toast.makeText(getApplicationContext(),"Purchase Canceled",Toast.LENGTH_SHORT).show();
        }
        // Handle any other error msgs
        else {
            Toast.makeText(getApplicationContext(),"Error "+billingResult.getDebugMessage(),Toast.LENGTH_SHORT).show();
        }
    }

    void handlePurchases(List<Purchase>  purchases) {
        for(Purchase purchase:purchases) {
            if (ProductId.GO_PREMIUM.toString().equals(purchase.getSku())) {
                handleProductPurchase(purchase, ProductId.GO_PREMIUM.toString());
            }
            else if (ProductId.EXTEND_VIDEO.toString().equals(purchase.getSku())) {
                handleProductPurchase(purchase, ProductId.EXTEND_VIDEO.toString());
            }
            else if (ProductId.REMOVE_ADS.toString().equals(purchase.getSku())) {
                handleProductPurchase(purchase, ProductId.REMOVE_ADS.toString());
            }
        }
    }

    private void handleProductPurchase(Purchase purchase, String productId){

        //if item is purchased
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            if (!verifyValidSignature(purchase.getOriginalJson(), purchase.getSignature())) {
                // Invalid purchase
                // show error to user
                Toast.makeText(getApplicationContext(), "Error : Invalid Purchase", Toast.LENGTH_SHORT).show();
                return;
            }
            // else purchase is valid
            //if item is purchased and not acknowledged
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams =
                        AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();

                if(productId.equals(ProductId.GO_PREMIUM.toString())){
                    billingClient.acknowledgePurchase(acknowledgePurchaseParams, ackGoPremiumPurchase);
                }
                else if(productId.equals(ProductId.EXTEND_VIDEO.toString())){
                    billingClient.acknowledgePurchase(acknowledgePurchaseParams, ackExtendVideoPurchase);
                }
                else if(productId.equals(ProductId.REMOVE_ADS.toString())){
                    billingClient.acknowledgePurchase(acknowledgePurchaseParams, ackRemoveAdsPurchase);
                }

            }
            //else item is purchased and also acknowledged
            else {

                if(productId.equals(ProductId.GO_PREMIUM.toString())){
                    // Grant entitlement to the user on item purchase
                    // restart activity
                    if (!purchaseVerifier.hasGoPremiumPurchased()) {
                        purchaseVerifier.saveGoPremiumPurchaseValue(true);
                        setPurchaseStateFor(ProductId.GO_PREMIUM.toString());
                        Toast.makeText(getApplicationContext(), "Congrats! You are Premium", Toast.LENGTH_SHORT).show();
                    }
                }
                else if(productId.equals(ProductId.EXTEND_VIDEO.toString())){
                    // Grant entitlement to the user on item purchase
                    // restart activity
                    if (!purchaseVerifier.hasExtendVideoPurchased()) {
                        purchaseVerifier.saveExtendVideoPurchaseValue(true);
                        setPurchaseStateFor(ProductId.EXTEND_VIDEO.toString());
                        Toast.makeText(getApplicationContext(), "Congrats!, video time extended", Toast.LENGTH_SHORT).show();
                    }

                }
                else if(productId.equals(ProductId.REMOVE_ADS.toString())){
                    // Grant entitlement to the user on item purchase
                    // restart activity
                    if (!purchaseVerifier.hasRemoveAdsPurchased()) {
                        purchaseVerifier.saveRemoveAdsPurchaseValue(true);
                        setPurchaseStateFor(ProductId.REMOVE_ADS.toString());
                        Toast.makeText(getApplicationContext(), "Congrats!, no more Ads", Toast.LENGTH_SHORT).show();
                    }
                }

                //this.recreate();
                //finish();
            }
        }
        //if purchase is pending
        else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            Toast.makeText(getApplicationContext(),
                    "Purchase is Pending. Please complete Transaction", Toast.LENGTH_SHORT).show();
        }
        //if purchase is unknown
        else if (purchase.getPurchaseState() == Purchase.PurchaseState.UNSPECIFIED_STATE) {
            if(productId.equals(ProductId.GO_PREMIUM.toString())){
                purchaseVerifier.saveGoPremiumPurchaseValue(false);
            }
            else if(productId.equals(ProductId.EXTEND_VIDEO.toString())){
                purchaseVerifier.saveExtendVideoPurchaseValue(false);
            }
            else if(productId.equals(ProductId.REMOVE_ADS.toString())){
                purchaseVerifier.saveRemoveAdsPurchaseValue(false);
            }
            
            Toast.makeText(getApplicationContext(), "Purchase Status Unknown", Toast.LENGTH_SHORT).show();
        }

    }

    AcknowledgePurchaseResponseListener ackRemoveAdsPurchase = new AcknowledgePurchaseResponseListener() {
        @Override
        public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
            if(billingResult.getResponseCode()==BillingClient.BillingResponseCode.OK){
                //if purchase is acknowledged
                // Grant entitlement to the user. and restart activity
                purchaseVerifier.saveRemoveAdsPurchaseValue(true);
                Toast.makeText(getApplicationContext(), "Item Purchased", Toast.LENGTH_SHORT).show();
                PurchaseActivity.this.recreate();               
            }
        }
    };

    AcknowledgePurchaseResponseListener ackExtendVideoPurchase = new AcknowledgePurchaseResponseListener() {
        @Override
        public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
            if(billingResult.getResponseCode()==BillingClient.BillingResponseCode.OK){
                //if purchase is acknowledged
                // Grant entitlement to the user. and restart activity
                purchaseVerifier.saveExtendVideoPurchaseValue(true);
                Toast.makeText(getApplicationContext(), "Item Purchased", Toast.LENGTH_SHORT).show();
                PurchaseActivity.this.recreate();               
            }
        }
    };

    AcknowledgePurchaseResponseListener ackGoPremiumPurchase = new AcknowledgePurchaseResponseListener() {
        @Override
        public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
            if(billingResult.getResponseCode()==BillingClient.BillingResponseCode.OK){
                //if purchase is acknowledged
                // Grant entitlement to the user. and restart activity
                purchaseVerifier.saveGoPremiumPurchaseValue(true);
                Toast.makeText(getApplicationContext(), "Item Purchased", Toast.LENGTH_SHORT).show();
                PurchaseActivity.this.recreate();               
            }
        }
    };

    /**
     * Verifies that the purchase was signed correctly for this developer's public key.
     * <p>Note: It's strongly recommended to perform such check on your backend since hackers can
     * replace this method with "constant true" if they decompile/rebuild your app.
     * </p>
     */
    private boolean verifyValidSignature(String signedData, String signature) {
        try {
            // To get key go to Developer Console > Select your app > Development Tools > Services & APIs.
            String base64Key = "MIIBCgKCAQEAmhIuYFKxjgv0Qkvylip4zjrcKxfuNUPkbdoUdcW0wQoOUKSd/szpvNwIDAQAB"; // It's not a valid key
            return Security.verifyPurchase(base64Key, signedData, signature);
        } catch (IOException e) {
            return false;
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if(billingClient!=null){
            billingClient.endConnection();
        }
    }

    public void closeIt(View v){
        finish();
    }
}