<template>
  <div 
    id="btech-editor-vue"
    :style="{
      'width': width + 'px',
      'right': minimized ? '-' + width + 'px' : '0px'
    }"
    style="
    position: fixed; 
    top: 0; 
    height: 100%; 
    background-color: #f1f1f1; 
    z-index: 999999;
    "
  >
    <div
      v-if="!minimized" 
    >
      <div 
        style="
          text-align: center;
          background-color: #B30B0F;
          color: white;
          cursor: pointer;
          user-select: none;
        "
        @click="minimize"
      >
        BTECH Editor
        <b>&#8250;</b>
      </div>

      <!--MODULES-->
      <div
        style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-auto-rows: auto;
          gap: 10px;
        " 
      >
        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
            gap: 10px; /* Optional: adjust space between items */
          "
        >
          <div>
            <input type="color" id="btech-custom-editor-buttons-color" list="default-colors" style="width: 48px; height: 28px; padding: 4px 0px 4px 4px;">
            <datalist id="default-colors">
              <option>#B30B0F</option>
              <option>#2232d2</option>
              <option>#1f89e5</option>
              <option>#32A852</option>
              <option>#E2A208</option>
              <option>#000000</option>
              <option>#FFFFFF</option>
            </datalist>
          </div>
          <!--Need to create a button that let's the user take a color on the page and recolor every element to the new color.-->
          <!-- Easiest way would be to create a datalist like above and then pull every color on the page and put it in the list.-->
          <!-- Then have a second data list for creating the new color. Hit recolor and it does a find replace-->
          <rce-recolor style="text-align: center;"></rce-recolor>
        </div>
        <!-- QUOTES -->
        <rce-citation></rce-citation>

        <rce-modal-header-banner
          :defaultimg="defaultimg"
          :color="elColor"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-header-banner>
        <!-- Video -->
        <rce-editor-icon :icon="'Video.png'"></rce-editor-icon>

        <rce-modal-header-left
          :defaultimg="defaultimg"
          :color="elColor"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-header-left>
        <rce-modal-header-right
          :defaultimg="defaultimg"
          :color="elColor"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-header-right>

        <rce-modal-image-right
          :defaultimg="defaultimg"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-image-right>
        <rce-modal-image-left
          :defaultimg="defaultimg"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-image-left>

        <!-- hidden modals -->
        <rce-modal-header-hex-hide
          :defaultimg="defaultimg"
          :color="elColor"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-header-hex-hide>
        <rce-modal-banner-hide
          :defaultimg="defaultimg"
          :color="elColor"
          :get-container="getContainer"
          :init-formatted-content="initFormattedContent"
        ></rce-modal-banner-hide>

        <!-- ELEMENTS -->
        <rce-callout></rce-callout>
        <rce-callout-header
          :color="elColor"
        ></rce-callout-header>

        <!-- Missing Icons -->
        <rce-information-box
          :color="elColor"
        ></rce-information-box>
        <rce-sidebar-comment
          :color="elColor"
        ></rce-sidebar-comment>

        <!--Hex image not working right now, so added hide to the component tag so nothing shows up-->
        <rce-hex-image-hide
          :defaultimg="defaultimg"
        ></rce-hex-image-hide>
      </div>

      <div>
      </div>
    </div>
  </div>
</template>