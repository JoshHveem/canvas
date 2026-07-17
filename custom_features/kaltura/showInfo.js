// Feel free to omit or fix any languages that aren’t in Kaltura’s enum list.
const kalturaLanguages = [
  // { label: "Albanian, Albania",           value: "Albanian" },
  { label: "Arabic, Arab World",          value: "Arabic" },
  // { label: "Armenian, Armenia",           value: "Armenian" },
  // { label: "Awadhi, India",               value: "Awadhi" },
  // { label: "Azerbaijani, Azerbaijan",     value: "Azerbaijani" },
  // { label: "Bashkir, Russia",             value: "Bashkir" },
  // { label: "Basque, Spain",               value: "Basque" },
  // { label: "Belarusian, Belarus",         value: "Byelorussian (Belarusian)" },
  // { label: "Bengali, Bangladesh",         value: "Bengali (Bangla)" },
  // { label: "Bhojpuri, India",             value: "Bhojpuri" },
  // { label: "Bosnian, Bosnia and Herzegovina", value: "Bosnian" }, // if Kaltura supports "Bosnian" or a fallback
  { label: "Brazilian Portuguese, Brazil",value: "Portuguese (Brazil)" },
  // { label: "Bulgarian, Bulgaria",         value: "Bulgarian" },
  { label: "Cantonese (Yue), China",      value: "Cantonese" },
  // { label: "Catalan, Spain",             value: "Catalan" },
  // { label: "Chhattisgarhi, India",        value: "Chhattisgarhi" }, // if supported
  { label: "Chinese, China",             value: "Chinese" },
  // { label: "Croatian, Croatia",          value: "Croatian" },
  // { label: "Czech, Czech Republic",       value: "Czech" },
  { label: "Danish, Denmark",            value: "Danish" },
  // { label: "Dogri, India",               value: "Dogri (generic)" },
  { label: "Dutch, Netherlands",         value: "Dutch" },
  { label: "English, United Kingdom",     value: "English (British)" },
  // { label: "Estonian, Estonia",          value: "Estonian" },
  // { label: "Faroese, Faroe Islands",      value: "Faeroese" },
  { label: "Finnish, Finland",           value: "Finnish" },
  { label: "French, France",             value: "French" },
  // { label: "Galician, Spain",            value: "Galician" }, // if supported
  // { label: "Georgian, Georgia",          value: "Georgian" },
  { label: "German, Germany",            value: "German" },
  { label: "Greek, Greece",              value: "Greek" },
  // { label: "Gujarati, India",            value: "Gujarati" },
  // { label: "Haryanvi, India",            value: "Haryanvi" }, // if supported
  { label: "Hindi, India",               value: "Hindi" },
  { label: "Hungarian, Hungary",         value: "Hungarian" },
  // { label: "Indonesian, Indonesia",      value: "Indonesian" },
  // { label: "Irish, Ireland",             value: "Irish" },
  { label: "Italian, Italy",             value: "Italian" },
  { label: "Japanese, Japan",            value: "Japanese" },
  // { label: "Javanese, Indonesia",        value: "Javanese" },
  // { label: "Kannada, India",             value: "Kannada" },
  // { label: "Kashmiri, India",            value: "Kashmiri" },
  // { label: "Kazakh, Kazakhstan",         value: "Kazakh" },
  // { label: "Konkani, India",             value: "Konkani (generic)" },
  { label: "Korean, South Korea",        value: "Korean" },
  // { label: "Kyrgyz, Kyrgyzstan",         value: "Kirghiz" },
  // { label: "Latvian, Latvia",            value: "Latvian (Lettish)" },
  // { label: "Lithuanian, Lithuania",      value: "Lithuanian" },
  // { label: "Macedonian, North Macedonia",value: "Macedonian" },
  // { label: "Maithili, India",            value: "Maithili" },
  { label: "Malay, Malaysia",            value: "Malay" },
  // { label: "Maltese, Malta",             value: "Maltese" },
  { label: "Mandarin, China",            value: "Mandarin Chinese" },
  // { label: "Marathi, India",             value: "Marathi" },
  // { label: "Marwari, India",             value: "Marwari" },
  // { label: "Min Nan, China",             value: "Min Nan" },
  // { label: "Moldovan, Moldova",          value: "Moldavian" },
  { label: "Mongolian, Mongolia",        value: "Mongolian" },
  // { label: "Montenegrin, Montenegro",    value: "Montenegrin" }, // if Kaltura has it
  // { label: "Nepali, Nepal",             value: "Nepali" },
  { label: "Norwegian, Norway",         value: "Norwegian" },
  // { label: "Oriya, India",              value: "Oriya" },
  { label: "Pashto, Afghanistan",       value: "Pashto (Pushto)" },
  { label: "Persian (Farsi), Iran",      value: "Persian" }, // or "Farsi"
  { label: "Polish, Poland",            value: "Polish" },
  { label: "Portuguese, Portugal",       value: "Portuguese" },
  { label: "Punjabi, India",            value: "Punjabi" },
  // { label: "Rajasthani, India",         value: "Rajasthani" }, // if supported
  { label: "Romanian, Romania",         value: "Romanian" },
  { label: "Russian, Russia",           value: "Russian" },
  // { label: "Sanskrit, India",           value: "Sanskrit" },
  // { label: "Santali, India",            value: "Santali" },
  // { label: "Serbian, Serbia",           value: "Serbian" },
  // { label: "Sindhi, Pakistan",          value: "Sindhi" },
  // { label: "Sinhala, Sri Lanka",         value: "Sinhalese" },
  // { label: "Slovak, Slovakia",          value: "Slovak" },
  // { label: "Slovene, Slovenia",         value: "Slovenian" },
  // { label: "Slovenian, Slovenia",       value: "Slovenian" },
  { label: "Spanish", value: "Spanish"},
  { label: "Ukrainian, Ukraine",        value: "Ukrainian" },
  { label: "Urdu, Pakistan",            value: "Urdu" },
  // { label: "Uzbek, Uzbekistan",         value: "Uzbek" },
  { label: "Vietnamese, Vietnam",       value: "Vietnamese" },
  // { label: "Welsh, Wales",              value: "Welsh" },
  // { label: "Wu, China",                 value: "Wu Chinese" }
];


let iframes = $("iframe");
iframes.each(function () {
  let iframe = $(this);
  let src = iframe.attr("src");
  if (src === undefined) return
  if (src.includes("kaltura")) {
    let playerIdMatch = src.match(/[playerSkin\/|kaltura_player_]([0-9]+)/);
    let playerId = playerIdMatch[1];
    //get video id
    let entryIdMatch = src.match(/entry[_]{0,1}id[=|\/]([0-9]_[a-zA-Z0-9]+)/);
    let entryId = entryIdMatch[1];

    let wrapDiv = $(`<div style="position: relative; display: inline-block;"></div>`);
    iframe.before(wrapDiv);
    wrapDiv.append(iframe);
    let kalturaInfoIconEl = $(`
    <i 
      class="icon-info" 
      style="position: absolute; right: .5rem; top: .5rem; z-index=999999; font-size=2rem; background-color: #FFFFFF; padding: .25rem; padding-bottom: .125rem; margin: 0px; border-radius: 2rem;">
    </i>
    `);
    wrapDiv.append(kalturaInfoIconEl);
    let kalturaInfoEl = $(`
      <div>
      </div>
    `);
    kalturaInfoEl.append(`
      <p><strong>Player ID: </strong><span id="kalturaPlayerId_${entryId}">${playerId}</span></p>
      <p><strong>Video ID: </strong><span id="kalturaEntryId_${entryId}">${entryId}</span></p>
      <p><strong>Owner ID: </strong><span id="kalturaOwnerId_${entryId}"></span></p>
      <div id="kalturaCaptionsId_${entryId}">Captions loading...</div>
    `);

    if (IS_TEACHER) {
      let addToMyMediaButton = $(`<a class="btn">Add to Media Gallery</a>`)
      kalturaInfoEl.append(addToMyMediaButton);
      addToMyMediaButton.click(function() {
        $.post("https://kaltura.bridgetools.dev/api/mymedia/"+ENV.COURSE_ID+"/entry/" + entryId);
        alert("Media has been added to this course's Media Gallery. It may take a few minutes for the media to appear.")
      });
    }
    wrapDiv.append(kalturaInfoEl);
    kalturaInfoEl.dialog({
      autoOpen: false,
      resizable: false,
      draggable: false,
      modal: true,
      show: "blind",
      hide: "blind",
      title: "Kaltura Info"
    });
    // Prepare the container for captions
    kalturaInfoIconEl.click(function () {
      let captions = $(`#kalturaCaptionsId_${entryId}`);
      captions.html('<div><h4><b>Captions</b></h4></div>');  // Clear old content
      $.get(`https://kaltura.bridgetools.dev/api/mymedia/${entryId}`, function(data) {
    
        // Show user ID
        $(`#kalturaOwnerId_${entryId}`).html(`
          <a target="_blank" 
             href="https://btech.instructure.com/accounts/3/users?search_term=${data.userId}">
            ${data.userId}
          </a>
        `);
    
    
        // For each caption track, create a clickable link to download
        for (let caption of data.captions) {
          let button = $(`<div><a style="margin-right: 10px; cursor: pointer;">
            Download ${caption.languageCode}
          </a></div>`);
    
          button.click(() => {
            // 1) Convert text into a blob
            let blob = new Blob([caption.text], { type: "text/plain" });
    
            // 2) Create a temporary URL for that blob
            let url = URL.createObjectURL(blob);
    
            // 3) Create a hidden <a> element to trigger the download
            let hiddenLink = document.createElement('a');
            hiddenLink.href = url;
            hiddenLink.download = `caption_${caption.languageCode}.txt`; 
            // e.g. "caption_en.txt" or "caption_es.txt"
    
            // 4) Programmatically click the <a> to start download
            hiddenLink.click();
    
            // 5) Release the URL object
            URL.revokeObjectURL(url);
          });
    
          captions.append(button);
        }

        // === ADD THIS BLOCK AFTER THE for-loop ===
        // 1. Create a container for "Request new translation"
        let requestDiv = $(`
          <div style="margin-top: 1em;">
            <label for="newCaptionSelect_${entryId}">
              Request a new translation. WARNING: translations are generated by AI and may contain errors.
            </label>
          </div>
        `);

        // 2. Create <select> with the possible languages
        let languageSelect = $(`<select id="newCaptionSelect_${entryId}"></select>`);
        kalturaLanguages.forEach(lang => {
          // lang.label is visible to the user, lang.value is the actual Kaltura enum
          languageSelect.append(
            `<option value="${lang.value}">${lang.value}</option>`
          );
        });

        // 3. Create a "Submit Request" button
        let requestButton = $(`<button style="margin-left: 6px;">Request</button>`);

        // 4. Handle the click (show an alert or do an AJAX POST, etc.)
        requestButton.click(() => {
          let selectedValue = languageSelect.val();
          // Do whatever you need:
          // e.g., a POST call to your caption request endpoint
          alert(`Requested new caption translation for: ${selectedValue}. You will be notified in your Canvas inbox when the translation is complete.`);
          
          $.put(`https://kaltura.bridgetools.dev/api/mymedia/${entryId}/captions/${selectedValue}`, {
            canvas_user_id: ENV.current_user_id
          });
          // create an alert letting the user know they'll get a message when the transcript is created
        });

        // 5. Put it all together
        requestDiv.append(languageSelect);
        requestDiv.append(requestButton);
        captions.append(requestDiv);
      });
    
      // Open the modal
      kalturaInfoEl.dialog("open");
    });
    
  }
});