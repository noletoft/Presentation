using Logger;
using PodcastMaker.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;
using Web.Models;

namespace PodcastMaker.Controllers
{
    public class HomeController : Controller
    {
        // setting it to 0 will bring max result
        private const int SEARCH_LIMIT = 10; // <-- number of items
        private const int DELETE_OLD_FILES = 20; // <-- in minutes
        private const int VIDEO_TIME_LIMIT = 5400; // <-- 01:30:00
        private const string YOUTUBE_ADDRESS1 = "https://www.youtube.com/watch?v=";
        private const string YOUTUBE_ADDRESS2 = "https://youtu.be/";
        private const string YOUTUBE_VIDEO_ID = "youtube_";
        private const string APPLE = "AP";
        private const string ANDROID = "AN";
        private const string ANY_CANADIAN_IP = "3.99.255.255";

        public static string DownsPath { get; set; }
        public static string FmpegPath { get; set; }
        public static string LogPath { get; set; }

        private string UserId {
            get
            {
                return GetUniqueUserId();
            }
        }

        public ActionResult Index(string origin, string txt)
        {
            origin = origin.Trim();

            if (HttpContext.Session["PlataformDef"] == null || HttpContext.Session["PlataformDef"] == string.Empty)
            {
                var plataform = string.Empty;

                if (origin != string.Empty)
                {
                    plataform = origin == APPLE ? APPLE : ANDROID;
                }

                HttpContext.Session["PlataformDef"] = plataform;
            }

            ViewData["Plataform"] = HttpContext.Session["PlataformDef"];

            //True means, its not from mobile App (ok but, is it from mobile browser? lets check)
            if (origin.Length == 0 && Request.Browser.IsMobileDevice)
            {
                return RedirectToAction("MobileApp");
            }

            DownsPath = Server.MapPath(Url.Content("~/Downs/"));
            FmpegPath = Server.MapPath(Url.Content("~/ffmpeg/"));
            LogPath = Server.MapPath(Url.Content("~/Logs/"));

            HttpContext.Session["ProgressInfoList"] = new List<Models.ProgressInfo>();

            var defaultItemColor = "#e0e0e0";

            List<string> itemColorList = new List<string>() { "#fcfdd4", "#ffebc0", "#fce1ff", "#feffd5", "#d5fbda", "#dcefff", "#dad3ff", "#dfffdf", "#f9e3c3" };

            var txtSearchIt = txt;

            if (txtSearchIt != null && txtSearchIt != string.Empty)
            {
                try
                {
                    ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"]).Clear();

                    var partialViewParameterList = new List<PartialViewParameter>();

                    var converter = new YTTMP3Converter.YTTMP3Converter(UserId, DownsPath, FmpegPath, LogPath);

                    converter.DeleteOldFiles(DownsPath, DELETE_OLD_FILES);

                    // **********  Do search by given address               

                    var videoId = txtSearchIt.Contains(YOUTUBE_VIDEO_ID) ? txtSearchIt.Replace(YOUTUBE_VIDEO_ID, string.Empty) : string.Empty;

                    if (videoId != string.Empty)
                    {
                        ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"]).Add(new Models.ProgressInfo());

                        //var thumbnail = string.Format(@"https://i.ytimg.com/vi/v={0}/mqdefault.jpg", videoId);
                        var thumbnail = string.Format(@"https://img.youtube.com/vi/{0}/mqdefault.jpg", videoId);                        

                        var channelName = new YTVideoSearcher.YTVideoSearcher(UserId, LogPath).GetChanelName(videoId).Result;

                        var paramModel = new PartialViewParameter()
                        {
                            ItemId = 0,
                            Thumbnail = thumbnail,
                            VideoId = videoId,
                            VideoTitle = string.Empty,
                            IsDownloaded = false,
                            ItemColor = defaultItemColor,
                            VideoTimeLimit = VIDEO_TIME_LIMIT,
                            UserId = UserId,
                            ChanelName = channelName,
                            HashTags = GenerateHashTags("", channelName)
                        };

                        partialViewParameterList.Add(paramModel);

                        ViewBag.SearchLimit = partialViewParameterList.Count;

                        return View(partialViewParameterList);
                    }

                    // **********  Do search by key word
                    Random rnd = new Random();
                    var index = rnd.Next(itemColorList.Count());
                    var itemColor = itemColorList[index];

                    var result = new PodcastMakerModel();

                    var isQuickSearch = txtSearchIt.Contains("isQuickSearch");

                    if (isQuickSearch)
                    {
                        txtSearchIt = txtSearchIt.Replace("isQuickSearch", string.Empty).Trim();
                        var countryInfo = GetCountryInfo();
                        var languageCode = countryInfo.Key;
                        var translateCountryName = countryInfo.Value;

                        var translationResult = new Translator.Translator(UserId, LogPath).GetTranslatation("en", languageCode, txtSearchIt).Result;
                                                
                        txtSearchIt = translationResult != string.Empty ? translationResult + " + " + translateCountryName : txtSearchIt;
                    }

                    result.SearchResultList = new YTVideoSearcher.YTVideoSearcher(UserId, LogPath).GetSearchResultListFromPage(txtSearchIt, DownsPath, SEARCH_LIMIT).Result.ToList();

                    var resultCount = result.SearchResultList.Count;

                    for (int i = 0; i < resultCount; i++)
                    {
                        ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"]).Add(new Models.ProgressInfo());
                    }

                    ViewBag.SearchLimit = resultCount;

                    var count = 0;
                    foreach (var item in result.SearchResultList)
                    {
                        var paramModel = new PartialViewParameter()
                        {
                            ItemId = count,
                            Thumbnail = item.ThumbnailMediun,
                            VideoId = item.VideoId,
                            VideoTitle = item.Title,
                            IsDownloaded = item.IsDowloaded,
                            ItemColor = count % 2 == 0 ? defaultItemColor : itemColor,
                            VideoTimeLimit = VIDEO_TIME_LIMIT,
                            UserId = UserId,
                            ChanelName = item.ChanelName,
                            HashTags = GenerateHashTags(txtSearchIt, item.ChanelName)
                        };

                        partialViewParameterList.Add(paramModel);

                        count++;
                    }
                    ModelState.Clear();
                    return View(partialViewParameterList);

                }
                catch (Exception ex)
                {
                    var errorMessage = string.Format("Error on search : {0}", ex.Message);
                    InfoLogger.GetSingleton(LogPath + UserId).LogInfo(errorMessage);
                    return RedirectToAction("Error");
                }
            }

            return View();
        }

        private string GenerateHashTags(string searchText, string chanelName)
        {
            var longWords = GetHashTagCandidates(searchText);

            var allSearchWordInOne = string.Join("", longWords);

            var chanelSplittedInOne = string.Join("", GetHashTagCandidates(chanelName,false));
                       
            var hashTagsList = new List<string>();

            foreach (var longWord in longWords)
            {
                hashTagsList.Add(chanelSplittedInOne + longWord);
            }

            var languageCode = string.Empty;

            if (Request.Cookies["lngCode"] != null)
            {
                languageCode = Request.Cookies["lngCode"].Value.ToString();
            }

            if (DateTime.Today.DayOfWeek == DayOfWeek.Friday) 
            {
                longWords.Add("thanksgoditsfriday");
                longWords.Add("itsfriday");
                longWords.Add("friday");

                if (languageCode == "pt")
                {
                    longWords.Add("sextou");                    
                }
            }

            if (languageCode == "pt")
            {
                longWords.Add("videocortado");
                longWords.Add("audiocortado");
                longWords.Add("audioextraido");
                longWords.Add("videoextraido");
            }

            longWords.Add("cutvideo");
            longWords.Add("cutaudio");
            longWords.Add("extractaudio");
            longWords.Add("extractvideo");
            longWords.Add("splitaudio");
            longWords.Add("splitvideo");
            longWords.Add("podcast");
            longWords.Add("podcastit");
            longWords.Add("noleheroes");
            longWords.Add(chanelSplittedInOne);
                        
            if (allSearchWordInOne.Any())
            {
                longWords.Add(allSearchWordInOne);
            }

            if (hashTagsList.Any())
            {
                longWords.AddRange(hashTagsList);
            }

            var hashTags = "#" + string.Join(" #", new List<string>(longWords.Distinct()));            

            return hashTags;
        }

        private List<string> GetHashTagCandidates(string textToHash, bool longWordsOnly = true) 
        {
            Regex r = new Regex("(?:[^a-z ]|(?<=['\"])s)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

            var cleanTitle = r.Replace(textToHash, String.Empty).ToLower();
            var splitCkeanTitle = cleanTitle.Split(new char[] { ' ' });
            return longWordsOnly ? splitCkeanTitle.Where(x => x.Length > 3).ToList() : splitCkeanTitle.ToList();
        }

        private KeyValuePair<string, string> GetCountryInfo()
        {
            var languageCode = string.Empty;
            var translateCountryName = string.Empty;

            if (Request.Cookies["lngCode"] != null)
            {
                languageCode = Request.Cookies["lngCode"].Value.ToString();
            }

            if (Request.Cookies["countryName"] != null)
            {
                translateCountryName = Request.Cookies["countryName"].Value.ToString();
            }                       
            
            // Lets translate the search if its from the quick search link
            if (languageCode == string.Empty || translateCountryName == string.Empty)
            {
                var ipAddress = Request.UserHostAddress;

                // if ip is localHost uses default ip (development reason only)
                ipAddress = ipAddress == "::1" ? ANY_CANADIAN_IP : ipAddress;

                var countryInfo = new Translator.Translator(UserId, LogPath).GetCountry(ipAddress).Result;
                languageCode = countryInfo.Key == string.Empty ? "en" : countryInfo.Key;
                translateCountryName = countryInfo.Value;

                if (languageCode != string.Empty)
                {
                    var lngCode = new HttpCookie("lngCode");
                    lngCode.Value = languageCode;
                    Response.Cookies.Add(lngCode);

                    var countryName = new HttpCookie("countryName");
                    countryName.Value = translateCountryName;
                    Response.Cookies.Add(countryName);
                }
            }

            return new KeyValuePair<string, string>(languageCode, translateCountryName);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult ExtractAudio(string videoId, string videoTitle, int ItemId, bool maxQuality, double duration)
        {
            if (duration > VIDEO_TIME_LIMIT)
            {
                return RedirectToAction("Error", "Home");
            }
                        
            var converter = new YTTMP3Converter.YTTMP3Converter(UserId, DownsPath, FmpegPath, LogPath);

            var videoAddress = YOUTUBE_ADDRESS1 + videoId;

            var result = new PodcastMakerModel();            
   
            ResetProgressInfo(ItemId);

            converter.ExtractAudio(videoAddress, videoTitle, maxQuality);

            var progressInfo = ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId];
                        
            IISTaskManager.Run(() =>
            {
                do
                {
                    // try a JS call from here and send all this info to front, or make ProgressInfoList not static
                    converter.ProgressInfo.CancelledByUserId = progressInfo.CancelledByUserId;
                    progressInfo.ProgressStatus = converter.ProgressInfo.ProgressStatus;
                    progressInfo.CurrentMP3FileConvertionFullPath = converter.ProgressInfo.CurrentMP3FileConvertionFullPath;
                    progressInfo.TotalFilesToConvert = converter.ProgressInfo.TotalFilesToConvert;
                    progressInfo.CurrentMP3FileConvertionId = converter.ProgressInfo.CurrentMP3FileConvertionId;
                    progressInfo.CurrentMP3FileConvertionName = converter.ProgressInfo.CurrentMP3FileConvertionName;
                    progressInfo.ZipFileName = converter.ProgressInfo.ZipFileName;
                    progressInfo.ZipFileFullPath = converter.ProgressInfo.ZipFileFullPath;
                    progressInfo.Bitrate = converter.ProgressInfo.Bitrate;
                    progressInfo.ProcessedDuration = converter.ProgressInfo.ProcessedDuration;
                    progressInfo.SizeKb = converter.ProgressInfo.SizeKb;
                    progressInfo.TotalDuration = converter.ProgressInfo.TotalDuration;
                    progressInfo.TotalZIPBytesToTransfer = converter.ProgressInfo.TotalZIPBytesToTransfer;
                    progressInfo.ZIPBytesTransferred = converter.ProgressInfo.ZIPBytesTransferred;
                    progressInfo.ErrorMessage = converter.ProgressInfo.ErrorMessage;
                    progressInfo.CroppedFileFullPath = converter.ProgressInfo.CroppedFileFullPath;
                    progressInfo.UserIdRequest = converter.ProgressInfo.UserIdRequest;                                        
                }
                while (progressInfo.ProgressStatus != YTTMP3Converter.YTTMP3Converter.Status.AllConcluded);

                progressInfo.DownloadFileName = GetFileName(progressInfo);
                                
            });

            //return new HttpStatusCodeResult(204);
            return Json("ok");            
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult SplitAudioVideo(string videoId, string videoTitle, int ItemId, int parts, int minutes, bool useRetake, double duration, bool maxQuality, bool splitVideo)
        {
            if (duration > VIDEO_TIME_LIMIT)
            {
                return RedirectToAction("Error");
            }
            
            var converter = new YTTMP3Converter.YTTMP3Converter(UserId, DownsPath, FmpegPath, LogPath);

            var videoAddress = YOUTUBE_ADDRESS1 + videoId;

            ResetProgressInfo(ItemId);
                        
            
            minutes = minutes > 0 ? minutes / 60 : minutes;

            converter.SplitAudioVideo(videoAddress, videoTitle, parts, minutes, true, true, useRetake, maxQuality, splitVideo, duration);

            var progressInfo = ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId];

            IISTaskManager.Run(() =>
            {
                do
                {
                    converter.ProgressInfo.CancelledByUserId = progressInfo.CancelledByUserId;
                    progressInfo.ProgressStatus = converter.ProgressInfo.ProgressStatus;
                    progressInfo.CurrentMP3FileConvertionFullPath = converter.ProgressInfo.CurrentMP3FileConvertionFullPath;
                    progressInfo.TotalFilesToConvert = converter.ProgressInfo.TotalFilesToConvert;
                    progressInfo.CurrentMP3FileConvertionId = converter.ProgressInfo.CurrentMP3FileConvertionId;
                    progressInfo.CurrentMP3FileConvertionName = converter.ProgressInfo.CurrentMP3FileConvertionName;
                    progressInfo.ZipFileName = converter.ProgressInfo.ZipFileName;
                    progressInfo.ZipFileFullPath = converter.ProgressInfo.ZipFileFullPath;
                    progressInfo.Bitrate = converter.ProgressInfo.Bitrate;
                    progressInfo.ProcessedDuration = converter.ProgressInfo.ProcessedDuration;
                    progressInfo.SizeKb = converter.ProgressInfo.SizeKb;
                    progressInfo.TotalDuration = converter.ProgressInfo.TotalDuration;
                    progressInfo.TotalZIPBytesToTransfer = converter.ProgressInfo.TotalZIPBytesToTransfer;
                    progressInfo.ZIPBytesTransferred = converter.ProgressInfo.ZIPBytesTransferred;
                    progressInfo.ErrorMessage = converter.ProgressInfo.ErrorMessage;
                    progressInfo.CroppedFileFullPath = converter.ProgressInfo.CroppedFileFullPath;
                    progressInfo.UserIdRequest = converter.ProgressInfo.UserIdRequest;
                }
                while (progressInfo.ProgressStatus != YTTMP3Converter.YTTMP3Converter.Status.AllConcluded);

                progressInfo.DownloadFileName = GetFileName(progressInfo);
            });

            return Json("ok");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult CropMedia(string videoId, string videoTitle, int ItemId, int cropStart, int cropEnd, bool cropVideo, double duration, bool maxQuality)
        {
            if (duration > VIDEO_TIME_LIMIT)
            {
                return RedirectToAction("Error");
            }
                        
            var converter = new YTTMP3Converter.YTTMP3Converter(UserId, DownsPath, FmpegPath, LogPath);

            var videoAddress = YOUTUBE_ADDRESS1 + videoId;

            ResetProgressInfo(ItemId);

            var crop = new int[] { cropStart, cropEnd };

            converter.CropAudioVideo(videoAddress, videoTitle, crop, cropVideo, maxQuality, duration);

            var progressInfo = ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId];

            IISTaskManager.Run(() =>
            {
                do
                {
                    converter.ProgressInfo.CancelledByUserId = progressInfo.CancelledByUserId;
                    progressInfo.ProgressStatus = converter.ProgressInfo.ProgressStatus;
                    progressInfo.CurrentMP3FileConvertionFullPath = converter.ProgressInfo.CurrentMP3FileConvertionFullPath;
                    progressInfo.TotalFilesToConvert = converter.ProgressInfo.TotalFilesToConvert;
                    progressInfo.CurrentMP3FileConvertionId = converter.ProgressInfo.CurrentMP3FileConvertionId;
                    progressInfo.CurrentMP3FileConvertionName = converter.ProgressInfo.CurrentMP3FileConvertionName;
                    progressInfo.ZipFileName = converter.ProgressInfo.ZipFileName;
                    progressInfo.ZipFileFullPath = converter.ProgressInfo.ZipFileFullPath;
                    progressInfo.Bitrate = converter.ProgressInfo.Bitrate;
                    progressInfo.ProcessedDuration = converter.ProgressInfo.ProcessedDuration;
                    progressInfo.SizeKb = converter.ProgressInfo.SizeKb;
                    progressInfo.TotalDuration = converter.ProgressInfo.TotalDuration;
                    progressInfo.TotalZIPBytesToTransfer = converter.ProgressInfo.TotalZIPBytesToTransfer;
                    progressInfo.ZIPBytesTransferred = converter.ProgressInfo.ZIPBytesTransferred;
                    progressInfo.ErrorMessage = converter.ProgressInfo.ErrorMessage;
                    progressInfo.CroppedFileFullPath = converter.ProgressInfo.CroppedFileFullPath;
                    progressInfo.UserIdRequest = converter.ProgressInfo.UserIdRequest;
                }
                while (progressInfo.ProgressStatus != YTTMP3Converter.YTTMP3Converter.Status.AllConcluded);

                progressInfo.DownloadFileName = GetFileName(progressInfo);
            });

            return Json("ok");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult GetProgressInfo(int ItemId)
        {
            var progressInfo = ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId];

            return Json(new
            {
                progressStatus = progressInfo.ProgressStatus.ToString(),                
                totalFilesToConvert = progressInfo.TotalFilesToConvert,
                currentMP3FileConvertionId = progressInfo.CurrentMP3FileConvertionId,
                bitrate = progressInfo.Bitrate,
                processedDuration = progressInfo.ProcessedDuration.TotalSeconds,
                sizeKb = progressInfo.SizeKb,
                totalDuration = progressInfo.TotalDuration.TotalSeconds,
                errorMessage = progressInfo.ErrorMessage,            
                downloadFileName = progressInfo.DownloadFileName,
            });
        }
        
        private string GetFileName(Models.ProgressInfo progressInfo)
        {
            var fileName = string.Empty;

            try
            {                
                var extractPath = progressInfo.CurrentMP3FileConvertionFullPath;
                var splitPath = progressInfo.ZipFileFullPath;
                var cropPath = progressInfo.CroppedFileFullPath;

                var filePath = string.Empty;

                if (extractPath != null && extractPath.Length > 0)
                {
                    filePath = extractPath;
                }

                if (splitPath != null && splitPath.Length > 0)
                {
                    filePath = splitPath;
                }

                if (cropPath != null && cropPath.Length > 0)
                {
                    filePath = cropPath;
                }

                string path = string.Empty;

                if (filePath != string.Empty)
                {
                    fileName = Path.GetFileName(filePath);                    
                }                
            }
            catch (Exception ex)
            {
                var errorMessage = string.Format("Error on getting file name ('{0}') : {1}", fileName, ex.Message);
                InfoLogger.GetSingleton(LogPath + UserId).LogInfo(errorMessage);
                RedirectToAction("Error");
            }

            return fileName;
        }

        public ActionResult Download(int ItemId)
        {
            var fileName = string.Empty;

            try
            {
                var progressInfo = ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId];

                fileName = GetFileName(progressInfo);

                if (fileName != string.Empty)
                {
                    string path = Server.MapPath(Url.Content("~/Downs/" + fileName));                    

                    Response.Clear();
                    Response.ContentType = "application/octet-stream";
                    Response.AppendHeader("Content-Disposition", "filename=" + fileName);

                    Response.TransmitFile(path);

                    Response.End();
                }
                                
                return new HttpStatusCodeResult(204);
            }
            catch (Exception ex)
            {
                var errorMessage = string.Format("Error on downloading file ('{0}') : {1}", fileName, ex.Message);                
                InfoLogger.GetSingleton(LogPath + UserId).LogInfo(errorMessage);
                return RedirectToAction("Error");
            }
        }

        public ActionResult CancelProgress(int ItemId) 
        {            
            ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId].CancelledByUserId = UserId;
            return new HttpStatusCodeResult(204);
        }

        public string RenderRazorViewToString(string viewName)
        {            
            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(ControllerContext,
                                                                         viewName);
                var viewContext = new ViewContext(ControllerContext, viewResult.View,
                                             ViewData, TempData, sw);
                viewResult.View.Render(viewContext, sw);
                viewResult.ViewEngine.ReleaseView(ControllerContext, viewResult.View);
                return sw.GetStringBuilder().ToString();
            }
        }

        public ActionResult Error()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult MobileApp()
        {
            ViewBag.Message = "Your application description page.";

            var countryInfo = GetCountryInfo();

            if (countryInfo.Key == "en") 
            {
                return View();
            }

            string html = RenderRazorViewToString("~/Views/Home/MobileApp.cshtml");

            string pattern = "<div tag.*?>(.*?)<\\/div>";

            MatchCollection matches = Regex.Matches(html, pattern);

            var translator = new Translator.Translator(UserId, LogPath);
                                               
            var originalTextList = new List<string>();
            var translatedTextList = new List<string>();

            // loop over the number of <div tag> found, each represent the area to be translated
            if (matches.Count > 0)
            {
                foreach (Match m in matches)
                {
                    var item = m.Groups[1].ToString();
                    originalTextList.Add(item);

                    var itemTranslated = translator.GetTranslatation("en", countryInfo.Key, item).Result;
                    translatedTextList.Add(itemTranslated);
                }
            }           
                        
            var pageTranslationContent = new PageTranslationContent()
            {
                CountryCode = countryInfo.Key,
                CountryName = countryInfo.Value,
                OriginalTextList = originalTextList,
                TranslatedTextList = translatedTextList,
                ShowTranslation = translatedTextList.Count > 0
            };

            var paramModel = new PartialViewParameter()
            {
                pageTranslationContent = pageTranslationContent
            };

            return View(paramModel);
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }
        
        public ActionResult PrivacyPolicy()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult FAQ()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Terms()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        public ActionResult ShareMedia()
        {
            return View();
        }

        private void ResetProgressInfo(int ItemId)
        {
            var progressInfo = ((List<Models.ProgressInfo>)HttpContext.Session["ProgressInfoList"])[ItemId];

            progressInfo.CurrentMP3FileConvertionFullPath = "";
            progressInfo.TotalFilesToConvert = 0;
            progressInfo.CurrentMP3FileConvertionId = 0;
            progressInfo.CurrentMP3FileConvertionName = "";
            progressInfo.ZipFileName = "";
            progressInfo.ZipFileFullPath = "";
            progressInfo.Bitrate = 0;
            progressInfo.ProcessedDuration = new TimeSpan();
            progressInfo.SizeKb = 0;
            progressInfo.TotalDuration = new TimeSpan();
            progressInfo.TotalZIPBytesToTransfer = 0;
            progressInfo.ZIPBytesTransferred = 0;
            progressInfo.ErrorMessage = "";
            progressInfo.CroppedFileFullPath = "";
            progressInfo.CancelledByUserId = string.Empty;            
        }

        private string GetUniqueUserId() 
        {
            var ipAddress = Request.UserHostAddress;
            var uniqueUserId = "user_" + BitConverter.ToInt32(IPAddress.Parse(ipAddress).GetAddressBytes(), 0);
            return uniqueUserId;
        }
    }
}