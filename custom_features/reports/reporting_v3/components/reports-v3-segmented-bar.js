(function () {
  function normalizeSize(value, fallback) {
    const raw = value == null ? "" : String(value).trim();
    if (!raw) return fallback;

    return /^-?\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw;
  }

  Vue.component("reports-v3-segmented-bar", {
    props: {
      segments: {
        type: Array,
        default: function () {
          return [];
        }
      },
      height: {
        type: [Number, String],
        default: 14
      },
      borderRadius: {
        type: [Number, String],
        default: 10
      },
      separatorColor: {
        type: String,
        default: "rgba(255,255,255,0.6)"
      },
      emptyColor: {
        type: String,
        default: "#F2F2F2"
      },
      markerPercent: {
        type: [Number, String],
        default: null
      },
      markerColor: {
        type: String,
        default: "#111827"
      },
      markerWidth: {
        type: [Number, String],
        default: 2
      },
      markerTitle: {
        type: String,
        default: ""
      }
    },

    computed: {
      normalizedHeight() {
        return normalizeSize(this.height, "14px");
      },

      normalizedBorderRadius() {
        return normalizeSize(this.borderRadius, "10px");
      },

      normalizedMarkerWidth() {
        return normalizeSize(this.markerWidth, "2px");
      },

      normalizedMarkerPercent() {
        const value = Number(this.markerPercent);
        if (!Number.isFinite(value)) return null;
        return Math.max(0, Math.min(100, value));
      },

      flattenedBars() {
        const items = [];

        (Array.isArray(this.segments) ? this.segments : []).forEach((segment, segmentIndex) => {
          const count = Math.max(0, Math.floor(Number(segment?.count) || 0));
          const name = String(segment?.name || `Segment ${segmentIndex + 1}`).trim();
          const color = String(segment?.color || this.emptyColor).trim() || this.emptyColor;

          for (let barIndex = 0; barIndex < count; barIndex += 1) {
            items.push({
              key: `segment-${segmentIndex}-${barIndex}`,
              name,
              color
            });
          }
        });

        return items;
      },

      hasBars() {
        return this.flattenedBars.length > 0;
      },

      rootStyle() {
        return {
          position: "relative",
          width: "100%",
          height: this.normalizedHeight,
          borderRadius: this.normalizedBorderRadius,
          overflow: "hidden",
          background: this.emptyColor
        };
      },

      barsStyle() {
        return {
          position: "absolute",
          inset: "0",
          display: "flex"
        };
      },

      markerStyle() {
        if (this.normalizedMarkerPercent == null) {
          return null;
        }

        return {
          position: "absolute",
          left: `${this.normalizedMarkerPercent}%`,
          top: "-3px",
          bottom: "-3px",
          width: this.normalizedMarkerWidth,
          background: this.markerColor,
          opacity: 0.6,
          transform: "translateX(-50%)"
        };
      }
    },

    template: `
      <div :style="rootStyle">
        <div v-if="hasBars" :style="barsStyle">
          <div
            v-for="(bar, index) in flattenedBars"
            :key="bar.key"
            :title="bar.name"
            :style="{
              flex: '1 1 0',
              background: bar.color,
              borderRight: index === flattenedBars.length - 1 ? 'none' : ('1px solid ' + separatorColor)
            }"
          ></div>
        </div>

        <div
          v-if="markerStyle"
          :title="markerTitle"
          :style="markerStyle"
        ></div>
      </div>
    `
  });
})();
