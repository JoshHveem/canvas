(()=>{(async function(){function t(e,a,l){let s=e.toLowerCase().replace(" ","-");$("#menu").append(`
      <li class="ic-app-header__menu-list-item">
        <a 
          id="global_nav_${s}_link" 
          role="button" 
          class="ic-app-header__menu-list-link" 
          data-track-category="${e}" 
          data-track-label="${e} button" 
          href="${a}"
        >
          <div class="menu-item-icon-container" role="presentation">
            ${l}
          </div>
          <div class="menu-item__text">
            ${e}
          </div>
        </a>      
      </li>
    `)}IS_TEACHER&&(t("Contact ISD","https://teams.microsoft.com/l/chat/0/0?users=jhveem@btech.edu,katie.stapley@btech.edu,logan.mano@btech.edu,mikaela.wilkins@btech.edu",`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width="100%"
      >
        <polygon
          points="60,2 115,35 115,85 60,118 5,85 5,35"
          fill="none"
          stroke="white"
          stroke-width="10"
        />
        <text
          x="60"
          y="80"
          font-family="Arial, sans-serif"
          text-anchor="middle"
          font-size="50"
          font-weight="bold"
          fill="white"
        >
          ISD 
        </text>
      </svg>`),t("Automations","https://automations.bridgetools.dev",`<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="100%"
        height="100%"
        class="ic-icon-svg menu-item__icon"
      >
        <defs>
          <style>
            .a{fill:none;stroke-width: 2.5; stroke:#FFFFFF;stroke-linecap:round;stroke-linejoin:round;}
          </style>
        </defs>
        <path class="a" d="M12,19.77a11.13,11.13,0,0,0-2.26.94L10,25.24,5.44,25a11.13,11.13,0,0,0-.94,2.26l3.37,3.05-3.37,3a10.68,10.68,0,0,0,.94,2.26L10,35.39l-.23,4.54a11.09,11.09,0,0,0,2.26.93l3.05-3.37,3,3.37a10.64,10.64,0,0,0,2.26-.93l-.23-4.54,4.54.23a10.64,10.64,0,0,0,.93-2.26l-3.37-3,3.37-3.05A11.09,11.09,0,0,0,24.66,25l-4.54.23.23-4.53a10.68,10.68,0,0,0-2.26-.94l-3,3.37Z"/>
        <circle class="a" cx="15.05" cy="30.32" r="3.96"/>
        <path class="a" d="M29.91,7.14a11,11,0,0,0-2.27.93l.24,4.54-4.54-.23a10.64,10.64,0,0,0-.93,2.26l3.36,3-3.36,3.05A11.09,11.09,0,0,0,23.34,23l4.54-.23-.24,4.53a11,11,0,0,0,2.27.94l3-3.37,3,3.37a11.13,11.13,0,0,0,2.26-.94L38,22.76l4.53.23a11.13,11.13,0,0,0,.94-2.26l-3.37-3.05,3.37-3a10.68,10.68,0,0,0-.94-2.26L38,12.61l.23-4.54A11,11,0,0,0,36,7.14l-3,3.37Z"/>
        <circle class="a" cx="32.95" cy="17.68" r="3.96"/>
      </svg>`))})();})();
