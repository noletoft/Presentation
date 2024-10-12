//
//  ViewController.swift
//
//  Created by F.Nolet on 2021-03-27.
//

import UIKit
import WebKit
import Foundation
import AVKit
import GoogleMobileAds

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler , WKNavigationDelegate, GADBannerViewDelegate, URLSessionDelegate, URLSessionDownloadDelegate {
            
    var webView : WKWebView!
    var progressView : UIProgressView!
    var progressDownLabel : UILabel!
    var progressBackLabel : UILabel!
    var btnCancelDown : UIButton!
    var imgSplash : UIImageView!
    var statusBarView = UIView()
    var downUrl : String!
    var urlSession: URLSession! = nil
    
    @IBOutlet var adBannerView: GADBannerView!
        
    override func loadView() {
       
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.userContentController.add(self, name: "urlDownload")
        webConfiguration.userContentController.add(self, name: "openFolder")
        webConfiguration.userContentController.add(self, name: "goToStore")
        webConfiguration.userContentController.add(self, name: "checkCredentials")
        webConfiguration.allowsInlineMediaPlayback = true
        webConfiguration.allowsPictureInPictureMediaPlayback =  false
        webConfiguration.allowsAirPlayForMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: webConfiguration)
        webView.uiDelegate = self
        webView.navigationDelegate = self
        webView.allowsLinkPreview = false
        view = webView        
                                      
        //Load Splash
        let img = UIImage(named: "splash")!
        imgSplash = UIImageView(image: img)
        imgSplash!.frame = CGRect(x: (UIScreen.main.bounds.size.width*0.5)-93, y: (UIScreen.main.bounds.size.height*0.5)-115,width: 185,height: 230)
        view.addSubview(imgSplash!)
        
        adBannerView = GADBannerView()
        adBannerView.isHidden = true;

    }
    
    override var prefersStatusBarHidden: Bool {
        get {
            return false
        }
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        imgSplash.isHidden = true
    
        statusBarView.frame = CGRect(x: 0, y: 0,width: Int(UIScreen.main.bounds.size.width),height: getStatusBarHeight() )
        let statusBarColor = [UIColor.orange, UIColor.green, UIColor.yellow, UIColor.systemBlue, UIColor.systemRed, UIColor.systemTeal, UIColor.systemPink, UIColor.systemPurple]
        statusBarView.backgroundColor = statusBarColor.randomElement()!
        self.view.addSubview(statusBarView)
        
        checkCredentials()
    }
    
    func getStatusBarHeight() -> Int{
        
        var statusBarHeight = 0
        
        if #available(iOS 13.0, *) {
            statusBarHeight = Int(view.window?.windowScene?.statusBarManager?.statusBarFrame.height ?? 20)
        } else {
            statusBarHeight = Int(UIApplication.shared.statusBarFrame.height)
        }
        
        return statusBarHeight
    }
    
    override func viewWillAppear(_ animated: Bool){
                
        // ********* For test purpose only (reset purchases) *********
        // UserDefaults.standard.set(false, forKey: "premium_purchased")
        // UserDefaults.standard.set(false, forKey: "extend_purchased")
        // UserDefaults.standard.set(false, forKey: "removeAds_purchased")
        
        checkCredentials();
        
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        let url = URL(string:"https://podcastit.com/Home/Index/AP")
        let myRequest = URLRequest(url: url!)
                        
        // LOAD BANNER
        loadADBanner()
        
        webView.load(myRequest)
                        
        //Set download progress control group
        progressBackLabel = UILabel()
        progressBackLabel.frame =  CGRect(x: (UIScreen.main.bounds.size.width*0.5)-105, y: UIScreen.main.bounds.size.height*0.5, width: 210, height: 70)
        progressBackLabel.textAlignment = .center
        progressBackLabel.backgroundColor = UIColor.white.withAlphaComponent(0.7)
        progressBackLabel.layer.masksToBounds = true
        progressBackLabel.layer.cornerRadius = 10.0
        
        progressDownLabel = UILabel()
        progressDownLabel.frame =  CGRect(x: (UIScreen.main.bounds.size.width*0.5)-60, y: (UIScreen.main.bounds.size.height*0.5)+2, width: 120, height: 20)
        progressDownLabel.textAlignment = .center
        progressDownLabel.text = "Downloading..."
        progressDownLabel.backgroundColor = UIColor.white.withAlphaComponent(0.0)
        progressDownLabel.layer.masksToBounds = true
        
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.tintColor = .blue
        progressView.frame = CGRect(x: (UIScreen.main.bounds.size.width*0.5)-100, y: (UIScreen.main.bounds.size.height*0.5)+28, width: 200, height: 5)
                                        
        btnCancelDown = UIButton(frame: CGRect(x: (UIScreen.main.bounds.size.width*0.5)-105, y: (UIScreen.main.bounds.size.height*0.5)+40, width: 210, height: 30))
        btnCancelDown.backgroundColor = .systemGray
        btnCancelDown.setTitle("Cancel", for: .normal)
        btnCancelDown.addTarget(self, action: #selector(cancelDownload), for: .touchUpInside)
        btnCancelDown.layer.cornerRadius = 5.0
        
        showDownloadProgress(hideIt: true)
        
        webView.addSubview(progressBackLabel)
        webView.addSubview(progressDownLabel)
        webView.addSubview(progressView)
        webView.addSubview(btnCancelDown)
        webView.addSubview(adBannerView)
        adBannerView.isHidden = UserDefaults.standard.bool(forKey: "removeAds_purchased")        
        
    } // viewDidLoad
    
    //Java scrip method call - from webpage
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        debugPrint("did receive message \(message.name)")
        debugPrint("did receive message \(message.body)")

        if (message.name == "urlDownload") {
            let strUrl = "https://podcastit.com/Downs/\(message.body)"
            downUrl = strUrl
            
            DispatchQueue.main.async {
                let configuration = URLSessionConfiguration.default
                let operationQueue = OperationQueue()
                self.urlSession = URLSession(configuration: configuration, delegate: self, delegateQueue: operationQueue)
                let fileUrl = URL(string: strUrl)
                let downloadTask = self.urlSession.downloadTask(with: fileUrl!)
                downloadTask.resume()
            }
            
            showDownloadProgress(hideIt: true)
            showDownloadProgress(hideIt: false)
        }
        else if(message.name == "openFolder") {
            OpenFolder()
        }
        else if( message.name ==  "goToStore"){
            
            let transition = CATransition()
            transition.duration = 0.3
            transition.type = CATransitionType.push
            transition.subtype = CATransitionSubtype.fromRight
            transition.timingFunction = CAMediaTimingFunction(name:CAMediaTimingFunctionName.easeInEaseOut)
            view.window!.layer.add(transition, forKey: kCATransition)
            
            let storyBoard: UIStoryboard = UIStoryboard(name: "Main", bundle: nil)            
            let newViewController = storyBoard.instantiateViewController(withIdentifier: "navigation")
            newViewController.modalPresentationStyle = .fullScreen
            self.present(newViewController, animated: false, completion: nil)

        }
        else if( message.name ==  "checkCredentials"){
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.checkCredentials()
            }
        }
        
    }
    
    // MARK: protocol stub for tracking download progress
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
                                
        // update the percentage label
        DispatchQueue.main.async {
            let progress =  ( Double(totalBytesWritten)/Double(totalBytesExpectedToWrite) ) * 100            
            self.downloadProgress(progress: Double(progress))
        }
    }
    
    // MARK: protocol stub for download completion tracking
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        
        do {
            // get downloaded data from location
            let data = readDownloadedData(of: location)

            let documentDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let fileName = documentDirectory.appendingPathComponent((downUrl as NSString).lastPathComponent)

            try data!.write(to: fileName)
            
            // set image to imageview
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                self.downloadCompleted(success: true,id: "")
            }
        
        }
        catch {
            print("Error")
        }
    }
    
    // MARK: read downloaded data
    func readDownloadedData(of url: URL) -> Data? {
        do {
            let reader = try FileHandle(forReadingFrom: url)
            let data = reader.readDataToEndOfFile()
                
            return data
        } catch {
            print(error)
            return nil
        }
    }
    
    @objc func cancelDownload(){
        
        if urlSession == nil || downUrl == nil || downUrl.isEmpty {
            return
        }
        
        urlSession.getAllTasks { (urlSessionTasks) in
            for task in urlSessionTasks{
                if let taskDescription = task.taskDescription, taskDescription == self.downUrl{
                    task.cancel()
                }
            }
        }
        
        showDownloadProgress(hideIt: true)
        
        downUrl = ""
    }
    
    func OpenFolder(){
        let path = getDocumentsDirectory().absoluteString.replacingOccurrences(of: "file://", with: "shareddocuments://")
        let url = URL(string: path)!

        UIApplication.shared.open(url)
    }
    
    //Show or hide progerss bar group
    func showDownloadProgress(hideIt : Bool){
        DispatchQueue.main.async {
            self.progressView.progress = Float(0)
            self.progressDownLabel.isHidden = hideIt
            self.progressView.isHidden = hideIt
            self.btnCancelDown.isHidden = hideIt
            self.progressDownLabel.isHidden = hideIt
            self.progressBackLabel.isHidden = hideIt
        }
        
        
    }
    
    func downloadProgress(progress: Double){
        DispatchQueue.main.async {
            if(Float(progress) >= self.progressView.progress){
                self.progressView.progress = Float(progress/100)
            }
        }
    }

    func downloadCompleted(success: Bool, id: String){
        DispatchQueue.main.async {
            self.showDownloadProgress(hideIt: true)
            
            let refreshAlert = UIAlertController(title: "Download complete!", message: "Do you want to see it in folder now?", preferredStyle: UIAlertController.Style.alert)

            refreshAlert.addAction(UIAlertAction(title: "Not now", style: .default, handler: { (action: UIAlertAction!) in
                
            }))
            
            refreshAlert.addAction(UIAlertAction(title: "Yes", style: .cancel, handler: { (action: UIAlertAction!) in
                self.OpenFolder()
            }))

            self.present(refreshAlert, animated: true, completion: nil)
        }
        
    }
    
    // Deal with all link calls
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView?{
        
                
        let url = navigationAction.request.url
        print(url?.absoluteURL as Any)
        
        if (url!.absoluteString.contains("CCRMFU9CVCKJN")) {
            UIApplication.shared.open(url!, options: [:], completionHandler: nil)
        }
        else if(url!.absoluteString.contains("whatsapp://send") ||
                url!.absoluteString.contains("telegram.me/share") ||
                url!.absoluteString.contains("fb-messenger://share") ||
                url!.absoluteString.contains("twitter.com/share") ||
                url!.absoluteString.contains("facebook.com/sharer") ||
                url!.absoluteString.contains("pinterest.com/pin") ||
                url!.absoluteString.contains("snapchat.com/scan") ||
                url!.absoluteString.contains("reddit.com/submit") ||
                url!.absoluteString.contains("linkedin.com/shareArticle") ||
                url!.absoluteString.contains("instagram://user")){

            if UIApplication.shared.canOpenURL(url! as URL) {
                UIApplication.shared.open(url! as URL, options: [:]) { (success) in
                            if success {
                                // Do Nothing                                
                            } else {
                                self.shareOnAnyApp(url: url!)
                            }
                        }
                }
        }
        else{
            shareOnAnyApp(url: url!)
        }
        
        return nil
    }
    
    //Open list of apps to share
    func shareOnAnyApp(url : URL){
        let objectsToShare = [url]
        let activityVC = UIActivityViewController(activityItems: objectsToShare as [Any], applicationActivities: nil)
        self.present(activityVC, animated: true, completion: nil)
    }
    
    //Get download folder address
    func getDocumentsDirectory() -> URL { // returns your application folder
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let documentsDirectory = paths[0]
        return documentsDirectory
    }
    
    override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
            super.viewWillTransition(to: size, with: coordinator)
        
        if UIDevice.current.userInterfaceIdiom == .phone{
            
            if UIDevice.current.orientation.isLandscape {
                print("Landscape")
                statusBarView.isHidden = true
                
            } else {
                print("Portrait")
                statusBarView.isHidden = false
            }
        }
        else if UIDevice.current.userInterfaceIdiom == .pad{
            statusBarView.frame = CGRect(x: 0, y: 0,width: Int(UIScreen.main.bounds.size.width),height: getStatusBarHeight() )
            let statusBarColor = [UIColor.orange, UIColor.green, UIColor.yellow, UIColor.systemBlue, UIColor.systemRed, UIColor.systemTeal, UIColor.systemPink, UIColor.systemPurple]
            statusBarView.backgroundColor = statusBarColor.randomElement()!
            self.view.addSubview(statusBarView)
        }
    }
    
    //BANNER methods
    
    func bannerViewDidReceiveAd(_ bannerView: GADBannerView) {
        //adBannerView.isHidden = UserDefaults.standard.bool(forKey: "removeAds_purchased")
    }

    func bannerView(_ bannerView: GADBannerView, didFailToReceiveAdWithError error: Error) {
        adBannerView.isHidden = true
        print("error here : \(error.localizedDescription)")
    }
    
    func loadADBanner() {
        
        adBannerView.isHidden = true
        adBannerView.delegate = self               
        
        #if DEBUG
        adBannerView.adUnitID = "ca-app-pub-3940256099942544/2934735716"
        #else
        adBannerView.adUnitID = "ca-app-pub-1059739534730598/7274593785"
        #endif
        
        adBannerView.rootViewController = self
        adBannerView.adSize = GADCurrentOrientationAnchoredAdaptiveBannerAdSizeWithWidth(UIScreen.main.bounds.size.width)
                
        adBannerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(adBannerView)
        view.addConstraints(
            [NSLayoutConstraint(item: adBannerView as Any,
                              attribute: .bottom,
                              relatedBy: .equal,
                              toItem: view.safeAreaLayoutGuide , 
                              attribute: .bottom,
                              multiplier: 1,
                              constant: 0),
             NSLayoutConstraint(item: adBannerView as Any,
                              attribute: .centerX,
                              relatedBy: .equal,
                              toItem: view,
                              attribute: .centerX,
                              multiplier: 1,
                              constant: 0)
          ])
        
        adBannerView.load(GADRequest())
        
    }
    
    // Check if Ads are removed (if user bought it)
    func checkCredentials(){
        
        // Hide Store from Menu
        if UserDefaults.standard.bool(forKey: "premium_purchased") ||
          (UserDefaults.standard.bool(forKey: "extend_purchased") && UserDefaults.standard.bool(forKey: "removeAds_purchased")){
            webView.evaluateJavaScript("hideStore()")
        }
        
        // give ALL
        if UserDefaults.standard.bool(forKey: "premium_purchased"){
            webView.evaluateJavaScript("setMaxTime()")
            adBannerView.isHidden = true
        }
        
        // Give extension only
        if UserDefaults.standard.bool(forKey: "extend_purchased"){
            webView.evaluateJavaScript("setMaxTime()")
        }
        
        // Remove Ads only
        if UserDefaults.standard.bool(forKey: "removeAds_purchased"){
            adBannerView.isHidden = true
        }
    }

}