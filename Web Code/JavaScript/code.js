<script type="text/javascript">

    var suggestCallBack; // global var for autocomplete jsonp

    $(document).ready(function () {

        let spanCombo = $(".ui-selectmenu-button-icon.ui-icon-caret-d.ui-icon.ui-widget-icon-floatend");
        if (isIE()) spanCombo.eq(@ItemId).removeClass("ui-icon");
        spanCombo.eq(@ItemId).css("margin-top", "unset");
        spanCombo.eq(@ItemId).css("background-position", "unset");
        spanCombo.eq(@ItemId).css("background-color", "unset");
        $("#cmbSplit_@ItemId-button").css("width", "70px");

        $('#collapse1_@ItemId').on('show.bs.collapse', function () {
            showCropButtons(false);
            $('html,body').animate({ scrollTop: $('#divExtHeader_@ItemId').offset().top - 60}, 800);
        });

        $('#collapse2_@ItemId').on('show.bs.collapse', function () {
            showCropButtons(false);
            $('html,body').animate({ scrollTop: $('#divSplitHeader_@ItemId').offset().top - 60}, 800);
        });

        $('#collapse3_@ItemId').on('show.bs.collapse', function () {
            showCropButtons(true);
            @*$('html,body').animate({ scrollTop: $('#divCutHeader_@ItemId').offset().top - 60 }, 800);*@
            $('html,body').animate({ scrollTop: $('#youtube-player_@ItemId').offset().top - 60 }, 800);
        });

        $('#collapse3_@ItemId').on('hidden.bs.collapse', function () {
            showCropButtons(false);
        });

        // **** Show or Hide Tile
        onScreenChange();

        $(window).resize(function () {
            onScreenChange();
        });

        function onScreenChange() {
            if ($(window).width() <= 768) {
                $('#trTitleTop_@ItemId').show();
                $('#divTitleCenter_@ItemId').hide();
                $('#divImgTime_@ItemId').hide();
                $('#divImgTimeMob_@ItemId').show();
                document.getElementById('tdThumbnail_@ItemId').style.position = 'unset';
                $('#divExtHeader_@ItemId').addClass("accord-header-height");
                $('#divSplitHeader_@ItemId').addClass("accord-header-height");
                $('#divCutHeader_@ItemId').addClass("accord-header-height");
            }
            else {
                $('#trTitleTop_@ItemId').hide();
                $('#divTitleCenter_@ItemId').show();
                $('#divImgTime_@ItemId').show();
                $('#divImgTimeMob_@ItemId').hide();
                document.getElementById('tdThumbnail_@ItemId').style.position = 'relative';
                $('#divExtHeader_@ItemId').removeClass("accord-header-height");
                $('#divSplitHeader_@ItemId').removeClass("accord-header-height");
                $('#divCutHeader_@ItemId').removeClass("accord-header-height");

            }
        }

        document.getElementById("tblProgressInfo_@ItemId").style.display = '@ViewData["Plataform"]'.length != 0 ? "none" : "block";

        //**** Slider Time

        @*$("#sliderTime_@ItemId").on("change", function () {
            let time = IntToTime($(this).val());
            $("#theTime .timeLabel")[@ItemId].val(time);
        });*@

        $("#time1_@ItemId").on("change", function () {
            let seconds = $(this).val();
            let time = IntToTime(seconds);
            $('#lblTime1_@ItemId').html(time);
            $("#spnSetStart_@ItemId").html(time);
            $(this).closest(".timeRangeSlider").find(".timeLabel").val(time);
            window["setCropTime_@ItemId"]();
        });

        $("#time2_@ItemId").on("change", function () {
            let seconds = $(this).val();
            let time = IntToTime(seconds);
            $('#lblTime2_@ItemId').html(time);
            $("#spnSetEnd_@ItemId").html(time);
            $(this).closest(".timeRangeSlider").find(".timeLabel2").val(time);
            window["setCropTime_@ItemId"]();
        });

        $("#cmbSplit_@ItemId").on("change", function () {
            let duration = (player_@ItemId).getDuration().toString();
            let selectedValue = $(this).children("option:selected").val();

            let splitMsg = '';

            var spliPartsChecked = document.getElementById('chkParts_@ItemId').checked;

            if (spliPartsChecked) {
                splitMsg = window["getSplitMessage_@ItemId"](selectedValue, IntToTime(duration / selectedValue));// 'It will be splitted in <strong>' + selectedValue + '</strong> parts of ' + IntToTime(duration / selectedValue) + ' each.';
            }
            else {
                let partsCount = duration / selectedValue;
                let partsCountResult = partsCount % 1 == 0 ? partsCount : getTruncated(partsCount) + 1;
                let partText = $(this).find(":selected").text();
                splitMsg = window["getSplitMessage_@ItemId"](partsCountResult, partText);// 'It will be splitted in ' + partsCount + ' parts of ' + partText + ' each.';
            }

            $("#splitMessage_@ItemId").html(splitMsg);
        });

        $("#time1_@ItemId").trigger("change");
        $("#time2_@ItemId").trigger("change");
        @*$("#sliderTime_@ItemId").trigger("change");*@

        $('#btnDownload_@ItemId').addClass("disabledbutton");

        if ('@isDownloaded' === 'True') {
            document.getElementById("divDownloaded_@ItemId").style.display = "block";
        }

        function showCropButtons(showIt)
        {
            document.getElementById("fsetCutControls_@ItemId").style.display = showIt ? "block" : "none";
        }

        window["disableAllControlItem_@ItemId"](true);

        document.getElementById("taCredits_@ItemId").style.height = "110px";
    });

    window["getSplitMessage_@ItemId"] = function(selectedValue, timeDesc) {
        return 'It will be splitted in <strong>' + selectedValue + '</strong> parts of <strong>' + timeDesc + '</strong> each.';
    }

    window["setCropTime_@ItemId"] = function() {
        var maxTime = document.getElementById("time2_@ItemId").getAttribute("max");
        var timeDiff = $("#time2_@ItemId").val() - $("#time1_@ItemId").val();

        var timePercent = Math.round((timeDiff / parseInt(maxTime)) * 100);
        $("#divTimePreview_@ItemId").html(IntToTime(timeDiff) + ' - ' + timePercent + '%');

        if (timePercent > 0) {
            $('#btnPreview_@ItemId').removeClass("disabledbutton");
            $('#btnCrop_@ItemId').removeClass("disabledbutton");
            document.getElementById("divMessage_@ItemId").style.display = "none";
        }
        else
        {
            $('#btnPreview_@ItemId').addClass("disabledbutton");
            $('#btnCrop_@ItemId').addClass("disabledbutton");
            window["showMessage_@ItemId"]('Cannot set <b>start time</b> bigger then <b>end time</b> or <b>end time</b> smaller then <b>start time</b>.', 'warn');
        }

        $("#divTimePreviewRegression_@ItemId").html(IntToTime(timeDiff));
    }

    function isIE() {
        ua = navigator.userAgent;
        /* MSIE used to detect old browsers and Trident used to newer ones*/
        var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;

        return is_ie;
    }

    function IntToTime(val) {

        let intToTimeResult = new Date(val * 1000);

        return intToTimeResult.toISOString().substr(11, 8);
    }

    function getTruncated(v) {
        if (!Math.trunc) {
            Math.trunc = function (v) {
                return v < 0 ? Math.ceil(v) : Math.floor(v);
            };
        }
        else {
            return Math.trunc(v);
        }
    }

    window["extractAudio_@ItemId"] = function() {
        var form = $('#_MainForm');
        var token = $('input[name="__RequestVerificationToken"]', form).val();
        let boostIt = document.getElementById('chkBoostQualityExt_@ItemId').checked;
        let vTitle = (player_@ItemId).getVideoData().title;
        var videoDuration = (player_@ItemId).getDuration();

        $.ajax({
            url: '/Home/ExtractAudio',
            type: 'POST',
            data: {
                __RequestVerificationToken: token,
                videoId: '@videoId', //'a3ir9HC9vYg',//'a3ir9HC9vYg'
                videoTitle: vTitle,
                ItemId: @ItemId, // <---------- dynamic value on search result list creation
                maxQuality: boostIt,
                duration: videoDuration
            },
            success: function () {
            },
            error: function (data) {
                //console.log(data);
                //window["showMessage_@ItemId"](data);
                //$('#messageError').show();
                //$('#messagesSignUp').append('<div class="messageType2">Something went wrong, please try again later.</div>');
            }
        });
    }

    window["splitAudioVideo_@ItemId"] = function() {
        let form = $('#_MainForm');
        let token = $('input[name="__RequestVerificationToken"]', form).val();

        let useRetakeChecek = document.getElementById('rd5sDelay_@ItemId').checked;
        let parts = window["getParts_@ItemId"]();
        let minutes = window["getMinutes_@ItemId"]();
        let videoDuration = (player_@ItemId).getDuration();
        let boostIt = document.getElementById('chkBoostQualitySpl_@ItemId').checked;
        let vTitle = (player_@ItemId).getVideoData().title;
        let splitAsVideo = document.getElementById('chkSplVideo_@ItemId').checked;

        $.ajax({
            url: '/Home/SplitAudioVideo',
            type: 'POST',
            data: {
                __RequestVerificationToken: token,
                videoId: '@videoId', //'a3ir9HC9vYg',//'a3ir9HC9vYg'
                videoTitle: vTitle,
                ItemId: @ItemId, // <---------- dynamic value on search result list creation
                parts: parts,
                minutes: minutes,
                useRetake: useRetakeChecek,
                duration: videoDuration,
                maxQuality: boostIt,
                splitVideo: splitAsVideo
            },
            success: function () {
            },
            error: function () {

                //$('#messagesSignUp').show();
                //$('#messagesSignUp').append('<div class="messageType2">Something went wrong, please try again later.</div>');
            }
        });
    }

    window["cropMedia_@ItemId"] = function() {
        var form = $('#_MainForm');
        var token = $('input[name="__RequestVerificationToken"]', form).val();

        var cropStartAt = $("#time1_@ItemId").val();
        var cropEndAt = $("#time2_@ItemId").val();
        var cropAsVideo = document.getElementById('chkVideo_@ItemId').checked;
        var videoDuration = (player_@ItemId).getDuration();
        let boostIt = document.getElementById('chkBoostQualityCrp_@ItemId').checked;
        let vTitle = (player_@ItemId).getVideoData().title;

        $.ajax({
            url: '/Home/CropMedia',
            type: 'POST',
            data: {
                __RequestVerificationToken: token,
                videoId: '@videoId', 
                videoTitle: vTitle,
                ItemId: @ItemId, // <---------- dynamic value on search result list creation
                cropStart: cropStartAt,
                cropEnd: cropEndAt,
                cropVideo: cropAsVideo,
                duration: videoDuration,
                maxQuality: boostIt
            },
            success: function () {
            },
            error: function () {

                //$('#messagesSignUp').show();
                //$('#messagesSignUp').append('<div class="messageType2">Something went wrong, please try again later.</div>');
            }
        });
    }

    var ctrlPlay_@ItemId = document.getElementById("youtube-playControl_@ItemId");

    var player_@ItemId;

    window["togglePlayButton_@ItemId"] = function(play) {
        $("#spnPreviewGlyphicon_@ItemId").removeClass(!play ? "glyphicon glyphicon-stop" : "glyphicon glyphicon-play");
        $("#spnPreviewGlyphicon_@ItemId").addClass(play ? "glyphicon glyphicon-stop" : "glyphicon glyphicon-play");
        $("#spnBtnText_@ItemId").html(play ? " Stop Preview" : " Start Preview");
        $("#prgPreview_@ItemId").attr('style', 'width: 0%');

        if (play) {
            $('#divCropControls_@ItemId').addClass("disabledbutton");
            $('#btnCrop_@ItemId').addClass("disabledbutton");
            $("#divSetStart_@ItemId").addClass("disabledbutton");
            $("#divSetEnd_@ItemId").addClass("disabledbutton");
        } else {
            $('#divCropControls_@ItemId').removeClass("disabledbutton");
            $('#btnCrop_@ItemId').removeClass("disabledbutton");
            $("#divSetStart_@ItemId").removeClass("disabledbutton");
            $("#divSetEnd_@ItemId").removeClass("disabledbutton");
        }
    }

    var time_@ItemId;

    window["toggleAudio_@ItemId"] = function () {
        if ((player_@ItemId).getPlayerState() == 1 || (player_@ItemId).getPlayerState() == 3) {
            (player_@ItemId).pauseVideo();
            window["togglePlayButton_@ItemId"](false);
            clearInterval(timer_@ItemId);
        }
        else {
            (player_@ItemId).seekTo($("#time1_@ItemId").val(), true);
            (player_@ItemId).playVideo();
            timer_@ItemId = setInterval(window["pausePreview_@ItemId"], 100);
            window["togglePlayButton_@ItemId"](true);

            $('html,body').animate({ scrollTop: $('#divTitle_@ItemId').offset().top -60 }, 800);
        }
    }

    window["pausePreview_@ItemId"] = function() {
        var percent = Math.round(((player_@ItemId).getCurrentTime() - $("#time1_@ItemId").val()) / ($("#time2_@ItemId").val() - $("#time1_@ItemId").val()) * 100);
        $("#prgPreview_@ItemId").attr('style', 'width: ' + percent + '%');
        $("#divTimePreviewRegression_@ItemId").html(IntToTime($("#time2_@ItemId").val() - (player_@ItemId).getCurrentTime()));
        if ((player_@ItemId).getCurrentTime() >= $("#time2_@ItemId").val()) {
            window["toggleAudio_@ItemId"]();
        }
    }



    window["onPlayerReady_@ItemId"] = function (event) {

        let duration = (player_@ItemId).getDuration();

        var videoTile = duration <= 0 ? '@videoTitle' : (player_@ItemId).getVideoData().title;
        $('#divTitleCenter_@ItemId').html(videoTile);
        $('#divTitleTop_@ItemId').html('<p>' + videoTile + '</p>');
        $('#divTitleTop_@ItemId').removeClass('mobile-title');
        $('#divTitleTop_@ItemId').addClass('horizontally');


        var txtTime = duration > 0 ? IntToTime(duration) : 'LIVE!';

        if (txtTime === 'LIVE!') {
            window["showMessage_@ItemId"]('You cannot process a LIVE! show, however you still can whatch it.', 'warn');
        }

        document.getElementById("divImgTime_@ItemId").style.color = txtTime === 'LIVE!' ? "orangered" : "greenyellow";
        document.getElementById("divImgTimeMob_@ItemId").style.color = txtTime === 'LIVE!' ? "orangered" : "green";

        window["disableAllControlItem_@ItemId"](false);

        let hour_1 = 2700; // 00:45:00
        let freeLimit = 1200; // 00:20:00

        if (duration > 0 && duration > freeLimit && duration < @videoTimeLimit) {
            if ('@ViewData["Plataform"]'.length != 0) {
                document.getElementById("divNeedExtraPurchase_@ItemId").style.display = 'block';
                window["disableAllControlItem_@ItemId"](true);
                checkCredentials(@ItemId);
            }

            if (duration > hour_1 && duration < @videoTimeLimit) {
                window["showMessage_@ItemId"]('Its a large video, be aware it will take more time to be processed.', 'warn');
            }
        }
        else if (duration > hour_1 && duration < @videoTimeLimit) {
            window["showMessage_@ItemId"]('Its a large video, be aware it will take more time to be processed.', 'warn');
        }
        else if (duration > @videoTimeLimit) {
            window["showMessage_@ItemId"]('This video reached the limit of ' + IntToTime(@videoTimeLimit) + ' and due to server limitations we cannot process it, sorry.', 'error');
            document.getElementById("divImgTime_@ItemId").style.color = txtTime === 'LIVE!' ? "orangered" : "orange";
            document.getElementById("divImgTimeMob_@ItemId").style.color = txtTime === 'LIVE!' ? "orangered" : "black";
            window["disableAllControlItem_@ItemId"](true);
        }
        else {
            window["disableAllControlItem_@ItemId"](txtTime === 'LIVE!');
        }

        $('#divImgTime_@ItemId').empty().html(txtTime);
        $('#divImgTimeMob_@ItemId').empty().html(txtTime);

        (player_@ItemId).setPlaybackQuality("small");
        document.getElementById("youtube-playControl_@ItemId").style.display = "block";
        window["togglePlayButton_@ItemId"]((player_@ItemId).getPlayerState() !== 5);

        document.getElementById("time1_@ItemId").setAttribute("min", "0");
        document.getElementById("time1_@ItemId").setAttribute("max", (duration - 10).toString());
        document.getElementById("time1_@ItemId").setAttribute("value", "0");

        document.getElementById("time2_@ItemId").setAttribute("min", "10");
        document.getElementById("time2_@ItemId").setAttribute("max", (duration).toString());
        document.getElementById("time2_@ItemId").setAttribute("value", (duration).toString());

        document.getElementById("slider1_@ItemId").value = IntToTime(0);
        document.getElementById("slider2_@ItemId").value = IntToTime(duration);

        $('#lblTime2_@ItemId').html(IntToTime(duration));
        $("#spnSetEnd_@ItemId").html(IntToTime(duration));
        $("#time2_@ItemId").val(duration);
        $("#divTimePreview_@ItemId").html(IntToTime(duration) + ' - 100%');
        $("#divTimePreviewRegression_@ItemId").html(IntToTime(duration));
        $("#splitMessage_@ItemId").html(window["getSplitMessage_@ItemId"](2, IntToTime(duration / 2)));
        $('.ui-rangeslider-sliders').eq(@ItemId).css('margin', '0 20px');

        $(".inactiveLink").removeClass('inactiveLink');

    }

    window["onPlayerStateChange_@ItemId"] = function(event) {
        if (event.data === 0) {
            window["togglePlayButton_@ItemId"](false);
        }

        if (event.data == YT.PlayerState.PLAYING) {
            document.getElementById("bars_@ItemId").style.display = "block";
        }
        else {
            document.getElementById("bars_@ItemId").style.display = "none";
        }
    }

    window["calculateMinutes_@ItemId"] = function () {
        $("#splitTitle_@ItemId").html("Split in Minutes");
        $("#chkMinutes_@ItemId").prop("checked", true);

        document.getElementById("lnkRdbParts_@ItemId").style.color = "black";
        document.getElementById("lnkRdbParts_@ItemId").style.fontWeight = "unset";
        document.getElementById("lnkRdbMinutes_@ItemId").style.color = "#3c95fd";
        document.getElementById("lnkRdbMinutes_@ItemId").style.fontWeight = "bold";

        let duration = (player_@ItemId).getDuration().toString();
        let minutes = (duration / 60) / 2;

        let minutesResult = minutes % 1 == 0 ? minutes : getTruncated(minutes) + 1;

        var cmbSplit = $("#cmbSplit_@ItemId");
        $("#cmbSplit_@ItemId-button").css("width", "110px");

        cmbSplit.empty();

        for (var i = 1; i < minutesResult; i++) {
            cmbSplit.append('<option value="' + i * 60 + '">' + IntToTime(i * 60) + '</option>')
        }

        $("#cmbSplit_@ItemId").find("option:last").attr("selected", "selected");

        let partsCount = Math.round(duration / (duration / 2));
        let partText = $("#cmbSplit_@ItemId").find("option:last").text();
        let splitMsg = window["getSplitMessage_@ItemId"](partsCount, partText);
        $(".ui-selectmenu-button-text").eq(@ItemId).html(partText);
        $("#splitMessage_@ItemId").html(splitMsg);
    }

    window["calculateParts_@ItemId"] = function () {
        $("#splitTitle_@ItemId").html("Split in Parts");
        $("#chkParts_@ItemId").prop("checked", true);

        document.getElementById("lnkRdbMinutes_@ItemId").style.color = "black";
        document.getElementById("lnkRdbMinutes_@ItemId").style.fontWeight = "unset";
        document.getElementById("lnkRdbParts_@ItemId").style.color = "#3c95fd";
        document.getElementById("lnkRdbParts_@ItemId").style.fontWeight = "bold";

        $('#cmbSplit_@ItemId').empty();
        $("#cmbSplit_@ItemId-button").css("width", "70px");

        $("#cmbSplit_@ItemId")
            .append('<option value="2">2</option>')
            .append('<option value="3">3</option>')
            .append('<option value="4">4</option>')
            .append('<option value="5">5</option>')

        $(".ui-selectmenu-button-text").eq(@ItemId).html(2);

        let duration = (player_@ItemId).getDuration().toString();

        $("#splitMessage_@ItemId").html(window["getSplitMessage_@ItemId"](2, IntToTime(duration / 2)));
    }

    window["rdSeamlessClick_@ItemId"] = function() {
        $("#rdSeamless_@ItemId").prop("checked", true);
        document.getElementById("lnkrd5sDelay_@ItemId").style.color = "black";
        document.getElementById("lnkrd5sDelay_@ItemId").style.fontWeight = "unset";
        document.getElementById("lnkSeamless_@ItemId").style.color = "#3c95fd";
        document.getElementById("lnkSeamless_@ItemId").style.fontWeight = "bold";
    }

    function showHideGuide(controlGuideTrigger, controlGuide, showMsg, hideMsg) {
        var controlText = $('#' + controlGuideTrigger).html();
        $('#' + controlGuideTrigger).html(controlText === showMsg ? hideMsg : showMsg);
        $('#' + controlGuide).toggle();
    }

    window["rd5sDelayClick_@ItemId"] = function() {
        $("#rd5sDelay_@ItemId").prop("checked", true);
        document.getElementById("lnkSeamless_@ItemId").style.color = "black";
        document.getElementById("lnkSeamless_@ItemId").style.fontWeight = "unset";
        document.getElementById("lnkrd5sDelay_@ItemId").style.color = "#3c95fd";
        document.getElementById("lnkrd5sDelay_@ItemId").style.fontWeight = "bold";
    }

    function highlightControl(contrlName, mode) {

        let bgColor = 'unset';

        if (mode === 'over') {
            bgColor = 'yellow';
        }

        $('#' + contrlName + '').css('background-color', bgColor)
    }

    var updateLoopInteration_@ItemId = 0;
    var splitPercent_@ItemId = 0;
    var sizeKbTmp_@ItemId = 0;
    var sizeKbTmpMax_@ItemId = 0;

    window["updateStatus_@ItemId"] = function(convertType) {

        var form = $('#_MainForm');
        var token = $('input[name="__RequestVerificationToken"]', form).val();

        let progressStatus = '';

        if (isNaN(splitPercent_@ItemId)) {
            splitPercent_@ItemId = 0;
        }

        if (isNaN(sizeKbTmp_@ItemId)) {
            sizeKbTmp_@ItemId = 0;
        }

        if (isNaN(sizeKbTmpMax_@ItemId)) {
            sizeKbTmpMax_@ItemId = 0;
        }

        updateLoopInteration_@ItemId++;

        $.ajax({
            url: '/Home/GetProgressInfo',
            type: 'POST',
            data: {
                __RequestVerificationToken: token,
                ItemId: @ItemId // <---------- dynamic value on search result list creation
            },
            success: function (data) {

                progressStatus = data.progressStatus;
                totalFilesToConvert = data.totalFilesToConvert;
                currentMP3FileConvertionId = data.currentMP3FileConvertionId;
                bitrate = data.bitrate;
                processedDuration = Math.round(IntToTime(data.processedDuration));
                sizeKb = data.sizeKb;
                totalDuration = Math.round(data.totalDuration);
                errorMessage = data.errorMessage;
                downloadFileName_@ItemId = data.downloadFileName;

                if (errorMessage !== null) {
                    window["resetMode_@ItemId"](convertType);
                    window["showMessage_@ItemId"]('Something went wrong with your request, please try again.', 'error');
                    window["cleanInterval_@ItemId"]();
                }
                else {
                    if (progressStatus !== 'SavingDownloadedVideo' && progressStatus !== 'Cancelled') {
                        if (progressStatus === 'Downloading') {
                            document.getElementById("prgBar1_@ItemId").style.display = "block";
                            $('#divProcessStatus_@ItemId').html('Processing...');
                            $('#divTotalTime_@ItemId').html('');
                            $('#divBitrate_@ItemId').html('');
                            $('#divFileSize_@ItemId').html('');

                            var percent = Math.round(((updateLoopInteration_@ItemId * 4) / (((player_@ItemId).getDuration() / 60) * 10)) * 100);
                            percent = percent > 100 ? 100 : percent;

                            if (convertType === 'extractAudio' || convertType === 'crop') {
                                document.getElementById("divProgDownload_@ItemId").style.width = percent / 2 + "%";

                            }
                            else if (convertType === 'split') {
                                document.getElementById("divProgDownload_@ItemId").style.width = percent / 2 + "%";

                            }

                        } else if (progressStatus === 'AllConcluded') {
                            $('#divProcessStatus_@ItemId').html('Concluded!');
                            $('#btnDownload_@ItemId').removeClass("disabledbutton");

                            document.getElementById("divProgDownload_@ItemId").style.width = "50%";

                            if (convertType === 'extractAudio'){
                                $('#divTotalTime_@ItemId').html(IntToTime((player_@ItemId).getDuration()));
                                if (bitrate == null) bitrate = 130;
                                $('#divBitrate_@ItemId').html(bitrate);
                            }

                            if (convertType === 'extractAudio' || convertType === 'crop') {
                                document.getElementById("divProgConvert_@ItemId").style.width = "50%";
                                $('#spnConvert_@ItemId').html('100% Converted');
                            }
                            else if (convertType === 'split') {
                                document.getElementById("divProgConvert_@ItemId").style.width = "50%";
                                $('#spnConvert_@ItemId').html('100% Converted');
                            }
                        }
                        else {
                            $('#divProcessStatus_@ItemId').html(progressStatus);
                            $('#divFileSize_@ItemId').html(window["formatSizeUnits_@ItemId"](sizeKb * 1024));
                            $('#divTotalTime_@ItemId').html(IntToTime(totalDuration));

                            if (convertType === 'crop') {
                                var timeDiff = $("#time2_@ItemId").val() - $("#time1_@ItemId").val();
                                $('#divTotalTime_@ItemId').html(IntToTime(timeDiff));
                            }

                            if (convertType === 'extractAudio' || convertType === 'crop') {
                                document.getElementById("divProgDownload_@ItemId").style.width = "50%";


                                document.getElementById("divDownloaded_@ItemId").style.display = "block";

                                var percent = Math.round((data.processedDuration / totalDuration) * 100);
                                document.getElementById("divProgConvert_@ItemId").style.width = percent / 2 + "%";
                                $('#spnConvert_@ItemId').html(percent + '% Converted');
                            }
                            else if (convertType === 'split') {

                                document.getElementById("divProgDownload_@ItemId").style.width = "50%";


                                if (sizeKb < sizeKbTmp_@ItemId) {
                                    sizeKbTmpMax_@ItemId += sizeKbTmp_@ItemId;
                                }

                                sizeKbTmp_@ItemId = sizeKb;

                                $('#divFileSize_@ItemId').html(window["formatSizeUnits_@ItemId"]((sizeKbTmpMax_@ItemId + sizeKbTmp_@ItemId) * 1024));


                                if (totalFilesToConvert > 2) {
                                    if (currentMP3FileConvertionId > 0) {
                                        var percent = Math.round((currentMP3FileConvertionId / (totalFilesToConvert + 1)) * 100);
                                    }
                                }
                                else {
                                    var percent = Math.round((data.processedDuration / totalDuration) * 100);

                                    if (percent < splitPercent_@ItemId) {
                                        percent += splitPercent_@ItemId;
                                    }
                                    else {
                                        splitPercent_@ItemId = percent;
                                    }
                                }

                                document.getElementById("divProgConvert_@ItemId").style.width = percent / 2 + "%";
                                $('#spnConvert_@ItemId').html(percent + '% Converted');
                            }
                        }
                    }

                    if (bitrate !== 'null') {
                        $('#divBitrate_@ItemId').html(bitrate);
                    }

                    if (progressStatus === 'AllConcluded') {
                        $('#divProcessStatus_@ItemId').html('Concluded!');
                        document.getElementById('divProcessStatus_@ItemId').style.color = '#35acd0';
                        document.getElementById('divProcessStatus_@ItemId').style.fontWeight = 'bold';

                        window["cleanInterval_@ItemId"]();
                        window["resetMode_@ItemId"](convertType);

                        if ('@ViewData["Plataform"]' === 'AP') {

                            document.getElementById('btnDownload_@ItemId').href = '';

                            $("#btnDownload_@ItemId").click(function () {
                                DownloadAp(downloadFileName_@ItemId);
                            });

                        }
                    }
                }
            },
            error: function (err) {
                //alert('error : ' + err)
                window["cleanInterval_@ItemId"]();
            }
        });
    }

    window["cleanInterval_@ItemId"] = function() {
        clearInterval(time_@ItemId);
        sizeKbTmp_@ItemId = 0;
        splitPercent_@ItemId = 0;
        sizeKbTmpMax_@ItemId = 0;
        updateLoopInteration_@ItemId = 0;
        window["disableAllControlItem_@ItemId"](false);
    }

    window["formatSizeUnits_@ItemId"] = function(bytes) {
        if (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; }
        else if (bytes >= 1048576) { bytes = (bytes / 1048576).toFixed(2) + " MB"; }
        else if (bytes >= 1024) { bytes = (bytes / 1024).toFixed(2) + " KB"; }
        else if (bytes > 1) { bytes = bytes + " bytes"; }
        else if (bytes == 1) { bytes = bytes + " byte"; }
        else { bytes = bytes + " bytes"; }
        return bytes;
    }

    window["resetMode_@ItemId"] = function (mode) {

        document.getElementById("divMessage_@ItemId").style.display = "none";

        if (mode === 'extractAudio') {
            let btnText = $("#spnExtractBtnText_@ItemId").text().trim();
            window["swapBtnState_@ItemId"]('#spnExtractGlyph_@ItemId', '#btnExtract_@ItemId', "#spnExtractBtnText_@ItemId", 'glyphicon-log-out', ' Extract Audio', btnText !== 'Cancel');
        }

        if (mode === 'split') {
            let btnText = $("#spnSplitBtnText_@ItemId").text().trim();
            window["swapBtnState_@ItemId"]('#spnSplitGlyph_@ItemId', '#btnSplit_@ItemId', "#spnSplitBtnText_@ItemId", 'glyphicon-sound-stereo', ' Split Audio', btnText !== 'Cancel');
        }

        if (mode === 'crop') {
            let btnText = $("#spnCropBtnText_@ItemId").text().trim();
            var audioChecked = document.getElementById('chkAudio_@ItemId').checked;
            let defaultText = audioChecked ? " Cut AUDIO range" : " Cut VIDEO range";
            window["swapBtnState_@ItemId"]('#spnCropGlyph_@ItemId', '#btnCrop_@ItemId', '#spnCropBtnText_@ItemId', 'glyphicon-scissors', defaultText, btnText !== 'Cancel');
        }

        window["disableAllControlItem_@ItemId"](false);

    }

    window["disableAllControlItem_@ItemId"] = function (disableIt) {

        $('#divExtractBody_@ItemId').find('*').each(function () {
            $(this).attr('disabled', disableIt);
        });

        $('#divSplitBody_@ItemId').find('*').each(function () {
            $(this).attr('disabled', disableIt);
        });

        $('#divCropBody_@ItemId').find('*').each(function () {
            $(this).attr('disabled', disableIt);
        });

        if (disableIt) {
            $('#divExtractBody_@ItemId').addClass('disabledbutton');
            $('#divSplitBody_@ItemId').addClass('disabledbutton');
            $('#divCropBody_@ItemId').addClass('disabledbutton');
            $('#divCropContent_@ItemId').addClass('disabledbutton');
            $('#divSplitContent_@ItemId').addClass('disabledbutton');
            $("#divSetStart_@ItemId").addClass("disabledbutton");
            $("#divSetEnd_@ItemId").addClass("disabledbutton");
            $('#fsetCutControls_@ItemId').addClass('disabledbutton');
        }
        else {
            $('#divExtractBody_@ItemId').removeClass('disabledbutton');
            $('#divSplitBody_@ItemId').removeClass('disabledbutton');
            $('#divCropBody_@ItemId').removeClass('disabledbutton');
            $('#divCropContent_@ItemId').removeClass('disabledbutton');
            $('#divSplitContent_@ItemId').removeClass('disabledbutton');
            $("#divSetStart_@ItemId").removeClass("disabledbutton");
            $("#divSetEnd_@ItemId").removeClass("disabledbutton");
            $('#fsetCutControls_@ItemId').removeClass('disabledbutton');
        }
    }

    window["disableContentControlItem_@ItemId"] = function (disableIt, mode) {

        if (mode === 'extractAudio') {

            $('#divSplitBody_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            $('#divCropBody_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            if (disableIt) {
                $('#divSplitBody_@ItemId').addClass('disabledbutton');
                $('#divCropBody_@ItemId').addClass('disabledbutton');
                $('#fsetCutControls_@ItemId').addClass('disabledbutton');
            }
            else {
                $('#divSplitBody_@ItemId').removeClass('disabledbutton');
                $('#divCropBody_@ItemId').removeClass('disabledbutton');
                $('#fsetCutControls_@ItemId').removeClass('disabledbutton');
            }
        }

        if (mode === 'split') {

            $('#divExtractBody_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            $('#divSplitContent_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            $('#divCropBody_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            if (disableIt) {
                $('#divExtractBody_@ItemId').addClass('disabledbutton');
                $('#divCropBody_@ItemId').addClass('disabledbutton');
                $('#divSplitContent_@ItemId').addClass('disabledbutton');
                $('#fsetCutControls_@ItemId').addClass('disabledbutton');
            }
            else {
                $('#divExtractBody_@ItemId').removeClass('disabledbutton');
                $('#divCropBody_@ItemId').removeClass('disabledbutton');
                $('#divSplitContent_@ItemId').removeClass('disabledbutton');
                $('#fsetCutControls_@ItemId').removeClass('disabledbutton');
            }
        }

        if (mode === 'crop') {

            $('#divExtractBody_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            $('#divSplitBody_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            $('#divCropContent_@ItemId').find('*').each(function () {
                $(this).attr('disabled', disableIt);
            });

            $('#btnPreview_@ItemId').attr('disabled', disableIt);

            if (disableIt) {
                $('#divExtractBody_@ItemId').addClass('disabledbutton');
                $('#divSplitBody_@ItemId').addClass('disabledbutton');
                $('#divCropContent_@ItemId').addClass('disabledbutton');
                $('#fsetCutControls_@ItemId').addClass('disabledbutton');
            }
            else {
                $('#divExtractBody_@ItemId').removeClass('disabledbutton');
                $('#divSplitBody_@ItemId').removeClass('disabledbutton');
                $('#divCropContent_@ItemId').removeClass('disabledbutton');
                $('#fsetCutControls_@ItemId').removeClass('disabledbutton');
            }
        }
    }

    window["showMessage_@ItemId"] = function (message, messageType) {
        document.getElementById("divMessage_@ItemId").style.display = "block";
        $('#divMessageContent_@ItemId').html(message);

        if (messageType === 'warn') {
            document.getElementById('divMessageContent_@ItemId').style.backgroundColor = '#ceecc6';
        }
        else if (messageType === 'error')
        {
            document.getElementById('divMessageContent_@ItemId').style.backgroundColor = '#ffb75f';
        }

    }

    window["extractContent_@ItemId"] = function() {

        let mode = 'extractAudio';

        let btnText = $("#spnExtractBtnText_@ItemId").text().trim();

        window["resetMode_@ItemId"](mode);
        window["resetProgressInfoTable_@ItemId"]();

        if (btnText === 'Cancel') {
            window["cleanInterval_@ItemId"]();
            window["cancelProcess_@ItemId"]();
        }
        else {
            document.getElementById("tblProgressInfo_@ItemId").style.display = "block";
            window["extractAudio_@ItemId"]();
            $('#divProcessType_@ItemId').html('Extracting Audio');
            time_@ItemId = setInterval(function () { window["updateStatus_@ItemId"](mode); }, 800);

            window["disableContentControlItem_@ItemId"](true, mode);

            $('html,body').animate({ scrollTop: $('#divTitle_@ItemId').offset().top -60 }, 800);
        }
    }

    window["splitContent_@ItemId"] = function() {

        let mode = 'split';

        let btnText = $("#spnSplitBtnText_@ItemId").text().trim();

        window["resetMode_@ItemId"](mode);
        window["resetProgressInfoTable_@ItemId"]();

        if (btnText === 'Cancel') {
            window["cleanInterval_@ItemId"]();
            window["cancelProcess_@ItemId"]();
        }
        else {
            document.getElementById("tblProgressInfo_@ItemId").style.display = "block";
            window["splitAudioVideo_@ItemId"]();
            $('#divProcessType_@ItemId').html('Spliting Audio');
            time_@ItemId = setInterval(function () { window["updateStatus_@ItemId"](mode); }, 800);

            window["disableContentControlItem_@ItemId"](true, mode);

            $('html,body').animate({ scrollTop: $('#divTitle_@ItemId').offset().top -60 }, 800);
        }
    }

    window["setCropBtnText_@ItemId"] = function() {
        let audioChecked = document.getElementById('chkAudio_@ItemId').checked;
        $("#spnCropBtnText_@ItemId").html(audioChecked ? " Cut AUDIO range" : " Cut VIDEO range");
        document.getElementById('chkBoostQualityCrp_@ItemId').checked = !audioChecked;
    }

    window["setSplitBtnText_@ItemId"] = function() {
        let audioChecked = document.getElementById('chkSplAudio_@ItemId').checked;
        $("#spnSplitBtnText_@ItemId").html(audioChecked ? " Split AUDIO" : " Split VIDEO");
        document.getElementById('chkBoostQualitySpl_@ItemId').checked = !audioChecked;
    }

    window["cropContent_@ItemId"] = function() {

        let mode = 'crop';

        let btnText = $("#spnCropBtnText_@ItemId").text().trim();

        window["resetMode_@ItemId"](mode);
        window["resetProgressInfoTable_@ItemId"]();

        if (btnText === 'Cancel') {
            window["cleanInterval_@ItemId"]();
            window["setCropBtnText_@ItemId"]();
            window["cancelProcess_@ItemId"]();
        }
        else {
            document.getElementById("tblProgressInfo_@ItemId").style.display = "block";
            window["cropMedia_@ItemId"]();
            time_@ItemId = setInterval(function () { window["updateStatus_@ItemId"](mode); }, 800);
            let audioChecked = document.getElementById('chkAudio_@ItemId').checked;
            $('#divProcessType_@ItemId').html('Cutting ' + (audioChecked ? 'Audio' : 'Video'));

            window["disableContentControlItem_@ItemId"](true, mode);

            $('html,body').animate({ scrollTop: $('#divTitle_@ItemId').offset().top -60 }, 800);
        }
    }

    window["cancelProcess_@ItemId"] = function() {
        location.href = '@Url.Action("CancelProgress", "Home", new { ItemId = ItemId })';
    }

    window["resetProgressInfoTable_@ItemId"] = function() {
        $('#divProcessType_@ItemId').html('- - -');
        $('#divProcessStatus_@ItemId').html('- - -');
        $('#divTotalTime_@ItemId').html('- - -');
        $('#divBitrate_@ItemId').html('- - -');
        $('#divFileSize_@ItemId').html('- - -');

        document.getElementById('divProcessStatus_@ItemId').style.color = 'unset';
        document.getElementById('divProcessStatus_@ItemId').style.fontWeight = 'unset';

        $('#btnDownload_@ItemId').addClass("disabledbutton");
        document.getElementById("prgBar1_@ItemId").style.display = "none";

        document.getElementById("divProgConvert_@ItemId").style.width = "0%";
        document.getElementById("divProgDownload_@ItemId").style.width = "0%";
    }

    window["getMinutes_@ItemId"] = function() {

        let minutesChecked = document.getElementById('chkMinutes_@ItemId').checked;

        return minutesChecked ? document.getElementById("cmbSplit_@ItemId").value : 0;
    }

    window["getParts_@ItemId"] = function()  {

        let partsChecked = document.getElementById('chkParts_@ItemId').checked;

        return partsChecked ? document.getElementById("cmbSplit_@ItemId").value : 0;
    }

    window["swapBtnState_@ItemId"] = function(ctrl1, ctrl2, ctrl3, glyph, iniText, iniState) {
        if (!iniState) {
            $('' + ctrl1 + '').removeClass('glyphicon-remove');
            $('' + ctrl1 + '').addClass(glyph);
            $('' + ctrl2 + '').removeClass('btn-danger');
            $('' + ctrl2 + '').addClass('btn-info');
            $('' + ctrl3 + '').html(iniText);
        }
        else {
            $('' + ctrl1 + '').removeClass(glyph);
            $('' + ctrl1 + '').addClass('glyphicon-remove');
            $('' + ctrl2 + '').removeClass('btn-info');
            $('' + ctrl2 + '').addClass('btn-danger');
            $('' + ctrl3 + '').html(" Cancel");
        }
    }

    window["startLeftArrow_@ItemId"] = function () {
        let timeValue = $("#time1_@ItemId").val();
        if (timeValue != 0) {
            $("#time1_@ItemId").val((timeValue - 1).toString());
            $("#time1_@ItemId").trigger("change");
        }
    }

    window["startRightArrow_@ItemId"] = function() {
        let timeValue = parseInt($("#time1_@ItemId").val());
        let duration = (player_@ItemId).getDuration();

        if (timeValue < duration) {
            $("#time1_@ItemId").val((timeValue + 1).toString());
            $("#time1_@ItemId").trigger("change");
        }
    }

    window["endLeftArrow_@ItemId"] = function () {
        let timeValue = $("#time2_@ItemId").val();
        if (timeValue != 0) {
            $("#time2_@ItemId").val((timeValue - 1).toString());
            $("#time2_@ItemId").trigger("change");
        }
    }

    window["endRightArrow_@ItemId"] = function() {
        let timeValue = parseInt($("#time2_@ItemId").val());
        let duration = (player_@ItemId).getDuration();

        if (timeValue < duration) {
            $("#time2_@ItemId").val((timeValue + 1).toString());
            $("#time2_@ItemId").trigger("change");
        }
     }

    window["SetStartTime_@ItemId"] = function () {
        let timeValue = (player_@ItemId).getCurrentTime();
        if (timeValue != 0) {
            $("#time1_@ItemId").val((timeValue).toString());
            $("#time1_@ItemId").trigger("change");
            $("#spnSetStart_@ItemId").html(IntToTime(timeValue));
        }
    }

    window["SetEndTime_@ItemId"] = function () {
        let timeValue = (player_@ItemId).getCurrentTime();
        let duration = (player_@ItemId).getDuration();

        if (timeValue > 0) {
            if (timeValue < duration) {
                $("#time2_@ItemId").val((timeValue).toString());
                $("#time2_@ItemId").trigger("change");
                $("#spnSetEnd_@ItemId").html(IntToTime(timeValue));
            }
        }
    }

    function DownloadAp(downloadUrlValue) {
        webkit.messageHandlers.urlDownload.postMessage(downloadUrlValue);
    }

    window["copyToClipboard_@ItemId"] = function () {
        var credits = document.getElementById('taCredits_@ItemId').value;

        console.log('@ViewData["Plataform"]');

        if ('@ViewData["Plataform"]' === 'AN') {            
            $('#taCredits_@ItemId').select();
            document.execCommand('copy');
        }
        else {
            navigator.clipboard.writeText(credits);
        }

        document.getElementById("creditsFinalMessage_@ItemId").style.display = "block";
        document.getElementById('credits_@ItemId').style.paddingBottom = 'unset';
    }

    window["generateHashTag_@ItemId"] = function () {

        var controlText = $('#' + 'btnHashTagsText_@ItemId').html();
        $('#' + 'btnHashTagsText_@ItemId').html(controlText === 'Remove Hashtags' ? 'Add Hashtags' : 'Remove Hashtags');

        if (controlText === 'Remove Hashtags') {

            document.getElementById('taCredits_@ItemId').value = '———— Credits ———— \n Youtube channel : @chanelName \n https://www.youtube.com/watch?v=@videoId \n\n Generated by: Podcast it! \n https://podcast-it.noleheroes.com';
        }
        else
        {
            var credits = document.getElementById('taCredits_@ItemId').value;

            var hashTags = '@hashTags' + '\n\n';

            document.getElementById('taCredits_@ItemId').value = hashTags + credits;
        }

        document.getElementById("creditsFinalMessage_@ItemId").style.display = "none";
        document.getElementById('credits_@ItemId').style.paddingBottom = '100px';
    }

    window["anchorToTop_@ItemId"] = function (control) {
        $('html,body').animate({ scrollTop: $('#'+control).offset().top - 60 }, 800);
    }

</script>