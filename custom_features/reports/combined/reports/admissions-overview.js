Vue.component('reports-admissions-overview', {
  props: {
    reportContext: { type: Object, default: () => ({}) },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    return {
      loading: false,
      loadError: '',
      year: Number(this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      rawRows: [],
      selectedProgram: '',
      selectedStageFocus: '',
      minCountThreshold: 3,
      selectedPath: '',
      hoveredPath: '',
      tooltip: {
        visible: false,
        x: 0,
        y: 0,
        html: ''
      }
    };
  },

  mounted() {
    this.syncFromReportContext();
    this.loadData();
    this._handleResize = () => this.renderChart();
    window.addEventListener('resize', this._handleResize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this._handleResize);
  },

  watch: {
    reportContext: {
      deep: true,
      handler() {
        const priorYear = this.year;
        this.syncFromReportContext();
        if (this.year !== priorYear) {
          this.loadData();
        } else {
          this.renderChart();
        }
      }
    },

    year() {
      this.loadData();
    },

    selectedProgram() {
      this.selectedPath = '';
      this.hoveredPath = '';
      this.hideTooltip();
      this.renderChart();
    },

    selectedStageFocus() {
      this.selectedPath = '';
      this.hoveredPath = '';
      this.hideTooltip();
      this.renderChart();
    },

    minCountThreshold() {
      this.selectedPath = '';
      this.hoveredPath = '';
      this.hideTooltip();
      this.renderChart();
    },

    treeData: {
      deep: true,
      handler() {
        this.$nextTick(() => this.renderChart());
      }
    }
  },

  computed: {
    yearOptions() {
      return Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    },

    programOptions() {
      return Array.from(
        new Set(
          this.rawRows
            .map(row => String(row?.program_name ?? '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));
    },

    stageOptions() {
      return Array.from(
        new Set(
          this.filteredRows.flatMap(row => Array.isArray(row?.candidacy_stages) ? row.candidacy_stages : [])
        )
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    },

    filteredRows() {
      return this.rawRows.filter(row => {
        const matchesYear = Number(row?.academic_year) === Number(this.year);
        const matchesProgram = !this.selectedProgram || String(row?.program_name ?? '').trim() === this.selectedProgram;
        return matchesYear && matchesProgram;
      });
    },

    treeData() {
      return this.buildJourneyTree(this.filteredRows, Number(this.minCountThreshold) || 1, this.selectedStageFocus);
    },

    treeNodeCount() {
      let count = 0;

      (function walk(node) {
        if (!node) return;
        if (node.stage_name !== 'Start') count += 1;
        (node.children || []).forEach(walk);
      })(this.treeData);

      return count;
    },

    terminalSummary() {
      const outcomes = [];

      (function walk(node) {
        if (!node) return;
        if (node.stage_name !== 'Start' && (!node.children || !node.children.length)) {
          outcomes.push({
            stage_name: node.stage_name,
            count: node.count
          });
        }
        (node.children || []).forEach(walk);
      })(this.treeData);

      return outcomes.sort((a, b) => b.count - a.count);
    }
  },

  methods: {
    syncFromReportContext() {
      const nextYear = Number(this.reportContext?.filters?.academic_year);
      if (Number.isFinite(nextYear) && nextYear !== this.year) {
        this.year = nextYear;
      }
    },

    getDataset() {
      return String(this.reportContext?.dataset || 'candidacies_stage_map').trim();
    },

    normalizeRow(row) {
      const candidacyStages = Array.isArray(row?.candidacy_stages)
        ? row.candidacy_stages.map(stage => String(stage ?? '').trim()).filter(Boolean)
        : [];
      const daysInStage = Array.isArray(row?.days_in_stage)
        ? row.days_in_stage.map(value => {
          const numberValue = Number(value);
          return Number.isFinite(numberValue) ? numberValue : NaN;
        })
        : [];

      return {
        candidacy_id: Number(row?.candidacy_id),
        academic_year: Number(row?.academic_year),
        program_name: String(row?.program_name ?? '').trim(),
        candidacy_stages: candidacyStages,
        days_in_stage: daysInStage,
        bridgetools_updated_at: String(row?.bridgetools_updated_at ?? '').trim()
      };
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';

        const rows = await bridgetools.req3(
          'reports',
          { academic_year: Number(this.year) },
          { dataset: this.getDataset() }
        );

        this.rawRows = (Array.isArray(rows) ? rows : []).map(row => this.normalizeRow(row));

        if (this.selectedProgram && !this.programOptions.includes(this.selectedProgram)) {
          this.selectedProgram = '';
        }
        if (this.selectedStageFocus && !this.stageOptions.includes(this.selectedStageFocus)) {
          this.selectedStageFocus = '';
        }
      } catch (e) {
        console.warn('Failed to load admissions overview dataset', e);
        this.rawRows = [];
        this.loadError = 'Unable to load admissions pathways.';
      } finally {
        this.loading = false;
        this.$nextTick(() => this.renderChart());
      }
    },

    createTreeNode(stageName, pathSoFar) {
      return {
        stage_name: stageName,
        path_so_far: pathSoFar,
        count: 0,
        terminal_count: 0,
        previous_stage_durations: [],
        median_days_in_previous_stage: null,
        synthetic_link_avg_days: null,
        force_keep: false,
        academic_years: new Set(),
        programs: new Set(),
        childrenByStage: new Map(),
        children: []
      };
    },

    buildJourneyTree(rows, minCountThreshold, focusedStageName) {
      const root = this.createTreeNode('Start', '');
      const focusedStage = String(focusedStageName ?? '').trim();
      const leadInDurations = [];
      let rootCount = 0;

      (Array.isArray(rows) ? rows : []).forEach(row => {
        const stages = Array.isArray(row?.candidacy_stages) ? row.candidacy_stages.filter(Boolean) : [];
        if (!stages.length) return;

        let relevantStages = stages.slice();
        let relevantDays = Array.isArray(row?.days_in_stage) ? row.days_in_stage.slice() : [];

        if (focusedStage) {
          const focusIndex = relevantStages.indexOf(focusedStage);
          if (focusIndex < 0) return;

          const leadInDuration = relevantDays
            .slice(0, focusIndex)
            .map(value => Number(value))
            .filter(Number.isFinite)
            .reduce((sum, value) => sum + value, 0);
          leadInDurations.push(leadInDuration);

          relevantStages = [' '].concat(relevantStages.slice(focusIndex));
          relevantDays = [leadInDuration].concat(relevantDays.slice(focusIndex));
        }

        rootCount += 1;

        let current = root;

        relevantStages.forEach((stageName, index) => {
          const cleanStageName = String(stageName ?? '').trim();
          const cleanParentPath = String(current.path_so_far ?? '').trim();
          const pathSoFar = cleanStageName
            ? (cleanParentPath ? `${cleanParentPath} > ${cleanStageName}` : cleanStageName)
            : current.path_so_far;
          let child = current.childrenByStage.get(stageName);

          if (!child) {
            child = this.createTreeNode(stageName, pathSoFar);
            current.childrenByStage.set(stageName, child);
          }

          child.count += 1;
          child.academic_years.add(Number(row?.academic_year));
          if (row?.program_name) child.programs.add(String(row.program_name));

          const previousStageDays = index > 0 ? Number(relevantDays[index - 1]) : NaN;
          if (index > 0 && Number.isFinite(previousStageDays)) {
            child.previous_stage_durations.push(previousStageDays);
          }

          current = child;
        });

        current.terminal_count += 1;
      });
      root.count = rootCount;

      if (focusedStage) {
        const syntheticLeadInNode = root.childrenByStage.get(' ');
        if (syntheticLeadInNode) {
          syntheticLeadInNode.force_keep = true;
          const focusedChild = syntheticLeadInNode.childrenByStage.get(focusedStage);
          if (focusedChild) {
            focusedChild.force_keep = true;
            focusedChild.synthetic_link_avg_days = this.average(leadInDurations);
          }
        }
      }

      const finalize = node => {
        const allChildren = Array.from(node.childrenByStage.values());
        allChildren.forEach(finalize);

        node.eventual_enrolled_terminal_count = (
          !allChildren.length && this.isEnrolledStage(node.stage_name)
            ? Number(node.terminal_count) || 0
            : 0
        ) + allChildren.reduce((sum, child) => sum + (Number(child.eventual_enrolled_terminal_count) || 0), 0);

        node.children = allChildren
          .filter(child =>
            child.force_keep ||
            child.count >= minCountThreshold ||
            (Number(child.eventual_enrolled_terminal_count) || 0) > 0
          )
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.stage_name.localeCompare(b.stage_name);
          });

        node.visible_enrolled_terminal_count = (
          !node.children.length && this.isEnrolledStage(node.stage_name)
            ? Number(node.terminal_count) || 0
            : 0
        ) + node.children.reduce((sum, child) => sum + (Number(child.visible_enrolled_terminal_count) || 0), 0);

        node.hidden_child_count = allChildren.length - node.children.length;

        node.median_days_in_previous_stage = this.median(node.previous_stage_durations);
        node.academic_years = Array.from(node.academic_years).filter(Number.isFinite).sort((a, b) => a - b);
        node.programs = Array.from(node.programs).sort((a, b) => a.localeCompare(b));
        delete node.childrenByStage;
        delete node.previous_stage_durations;
        delete node.force_keep;
        return node;
      };

      return finalize(root);
    },

    average(values) {
      const nums = (Array.isArray(values) ? values : [])
        .map(value => Number(value))
        .filter(Number.isFinite);

      if (!nums.length) return null;
      return nums.reduce((sum, value) => sum + value, 0) / nums.length;
    },

    median(values) {
      const nums = (Array.isArray(values) ? values : [])
        .map(value => Number(value))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

      if (!nums.length) return null;
      const mid = Math.floor(nums.length / 2);
      return nums.length % 2 === 0
        ? (nums[mid - 1] + nums[mid]) / 2
        : nums[mid];
    },

    formatDays(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return 'n/a';
      return `${num.toFixed(1)}d`;
    },

    formatPercent(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return 'n/a';
      return `${(num * 100).toFixed(1)}%`;
    },

    isEnrolledStage(stageName) {
      return String(stageName ?? '').toLowerCase().includes('enroll');
    },

    nodeEventualEnrollmentRate(nodeData) {
      const count = Number(nodeData?.count) || 0;
      const enrolledTerminalCount = Number(nodeData?.eventual_enrolled_terminal_count) || 0;
      if (count <= 0) return NaN;
      return enrolledTerminalCount / count;
    },

    nodeFill(nodeData) {
      const name = String(nodeData?.stage_name ?? '').toLowerCase();
      const isTerminal = !nodeData?.children?.length;

      if (!name.trim()) return '#cbd5e1';
      if (isTerminal && name.includes('enroll')) return '#1f7a4d';
      if (isTerminal && (name.includes('withdraw') || name.includes('declin'))) return '#b2412f';
      if (isTerminal && (name.includes('wait') || name.includes('hold'))) return '#a16207';
      if (isTerminal && (name.includes('deny') || name.includes('dnc'))) return '#7c3aed';
      if (isTerminal) return '#475569';
      return '#111827';
    },

    selectedOrHoveredPathPrefix() {
      return this.selectedPath || '';
    },

    pathIsHighlighted(path) {
      const activePath = this.selectedOrHoveredPathPrefix();
      return activePath ? String(path || '').startsWith(activePath) || activePath.startsWith(String(path || '')) : false;
    },

    renderChart() {
      if (!this.$refs.chartSvg || !window.d3) return;

      const svg = d3.select(this.$refs.chartSvg);
      svg.selectAll('*').remove();

      if (this.loading || this.loadError || !this.treeData?.children?.length) return;

      const container = this.$refs.chartWrap;
      const width = Math.max((container?.clientWidth || 960) - 8, 640);
      const margin = { top: 36, right: 220, bottom: 36, left: 72 };
      const firstStageOffsetPx = 28;
      const minNodeGapPx = 36;

      const root = d3.hierarchy(this.treeData, d => d.children);
      d3.tree().nodeSize([54, 1])(root);

      const annotate = (node, cumulativeMedianDays) => {
        node.data.cumulative_median_days = cumulativeMedianDays;
        (node.children || []).forEach(child => {
          const nextDays = cumulativeMedianDays + (Number.isFinite(child.data.median_days_in_previous_stage)
            ? child.data.median_days_in_previous_stage
            : 0);
          annotate(child, nextDays);
        });
      };
      annotate(root, 0);

      const allNodes = root.descendants();
      const visibleNodes = allNodes.filter(node => node.depth > 0);
      if (!visibleNodes.length) return;

      const xExtent = d3.extent(allNodes, node => node.x);
      const minX = Number.isFinite(xExtent[0]) ? xExtent[0] : 0;
      const maxX = Number.isFinite(xExtent[1]) ? xExtent[1] : 0;
      const availableHeight = Math.max(container?.clientHeight || 0, 360);
      const contentHeight = (maxX - minX) + margin.top + margin.bottom + 40;
      const height = Math.max(availableHeight, Math.min(contentHeight, Math.max(availableHeight, 720)));
      const xOffset = margin.top - minX + 20;
      const maxMedianDays = d3.max(visibleNodes, node => Number(node.data.cumulative_median_days) || 0) || 0;

      const yScale = d3.scaleLinear()
        .domain([0, maxMedianDays || 1])
        .range([margin.left, width - margin.right]);

      const radiusScale = d3.scaleSqrt()
        .domain([1, d3.max(visibleNodes, node => node.data.count) || 1])
        .range([5, 18]);

      root.each(node => {
        const actualX = yScale(Number(node.data.cumulative_median_days) || 0);
        if (!node.parent) {
          node.data.display_x = actualX;
          return;
        }

        const parentDisplayX = Number(node.parent.data.display_x) || margin.left;
        const baseX = node.depth === 1 ? actualX + firstStageOffsetPx : actualX;
        node.data.display_x = Math.max(baseX, parentDisplayX + minNodeGapPx);
      });

      const nodeX = node => Number(node.data.display_x) || margin.left;
      const nodeY = node => node.x + xOffset;
      const linkPath = link => {
        const sx = nodeX(link.source);
        const sy = nodeY(link.source);
        const tx = nodeX(link.target);
        const ty = nodeY(link.target);
        const mx = (sx + tx) / 2;
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      };

      const labelYOffsetPattern = [-14, 0, 14, -24, 24];
      const labelCollisionX = 72;
      const labelCollisionY = 58;
      const sortedForLabels = [...visibleNodes].sort((a, b) => {
        const xDiff = nodeX(a) - nodeX(b);
        if (Math.abs(xDiff) > 1) return xDiff;
        return nodeY(a) - nodeY(b);
      });
      let cluster = [];
      const flushLabelCluster = () => {
        cluster.forEach((node, index) => {
          node.data.label_offset_y = labelYOffsetPattern[index % labelYOffsetPattern.length];
        });
        cluster = [];
      };

      sortedForLabels.forEach(node => {
        if (!cluster.length) {
          cluster.push(node);
          return;
        }

        const prev = cluster[cluster.length - 1];
        const isClose = Math.abs(nodeX(node) - nodeX(prev)) <= labelCollisionX
          && Math.abs(nodeY(node) - nodeY(prev)) <= labelCollisionY;

        if (isClose) {
          cluster.push(node);
        } else {
          flushLabelCluster();
          cluster.push(node);
        }
      });
      flushLabelCluster();

      svg
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .style('display', 'block')
        .style('background', '#fff');

      const zoomLayer = svg.append('g');
      const baseLayer = zoomLayer.append('g');

      svg.call(
        d3.zoom()
          .scaleExtent([0.7, 4])
          .on('zoom', event => {
            zoomLayer.attr('transform', event.transform);
          })
      );

      const axisTicks = yScale.ticks(6).filter(value => value > 0);
      baseLayer.selectAll('.time-grid')
        .data(axisTicks)
        .enter()
        .append('line')
        .attr('x1', tick => yScale(tick))
        .attr('x2', tick => yScale(tick))
        .attr('y1', 12)
        .attr('y2', height - margin.bottom + 8)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-dasharray', '4 6');

      baseLayer.selectAll('.time-label')
        .data(axisTicks)
        .enter()
        .append('text')
        .attr('x', tick => yScale(tick))
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .style('font-size', '11px')
        .text(tick => `${Math.round(tick)}d`);

      const links = root.links().filter(link => link.target.depth > 0);
      baseLayer.selectAll('.journey-link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'journey-link')
        .attr('d', linkPath)
        .attr('fill', 'none')
        .attr('stroke', link => {
          if (link.source.depth === 0) return '#cbd5e1';
          return this.pathIsHighlighted(link.target.data.path_so_far) ? '#111827' : '#9ca3af';
        })
        .attr('stroke-opacity', link => {
          if (link.source.depth === 0) return 0.7;
          return this.pathIsHighlighted(link.target.data.path_so_far) ? 0.95 : 0.55;
        })
        .attr('stroke-width', link => link.source.depth === 0 ? 2 : 3)
        .attr('stroke-linecap', 'round');

      const focusedLeadInLinks = links.filter(link => Number.isFinite(link.target.data.synthetic_link_avg_days));
      baseLayer.selectAll('.journey-link-label')
        .data(focusedLeadInLinks)
        .enter()
        .append('text')
        .attr('class', 'journey-link-label')
        .attr('x', link => (nodeX(link.source) + nodeX(link.target)) / 2)
        .attr('y', link => ((nodeY(link.source) + nodeY(link.target)) / 2) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .style('font-size', '11px')
        .style('font-weight', 600)
        .text(link => `Avg from first stage: ${this.formatDays(link.target.data.synthetic_link_avg_days)}`);

      const nodeGroups = baseLayer.selectAll('.journey-node')
        .data(visibleNodes)
        .enter()
        .append('g')
        .attr('class', 'journey-node')
        .attr('transform', node => `translate(${nodeX(node)},${nodeY(node)})`)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, node) => {
          this.hoveredPath = node.data.path_so_far;
          this.showTooltip(event, node);
        })
        .on('mousemove', event => {
          this.moveTooltip(event);
        })
        .on('mouseleave', () => {
          this.hoveredPath = '';
          this.hideTooltip();
        })
        .on('click', (event, node) => {
          this.selectedPath = this.selectedPath === node.data.path_so_far ? '' : node.data.path_so_far;
          this.renderChart();
        });

      nodeGroups.append('circle')
        .attr('r', node => radiusScale(node.data.count))
        .attr('fill', node => this.nodeFill(node.data))
        .attr('stroke', node => this.pathIsHighlighted(node.data.path_so_far) ? '#f59e0b' : '#ffffff')
        .attr('stroke-width', node => this.pathIsHighlighted(node.data.path_so_far) ? 3 : 1.5);

      nodeGroups.append('text')
        .attr('x', node => radiusScale(node.data.count) + 8)
        .attr('y', node => 4 + (Number(node.data.label_offset_y) || 0))
        .attr('fill', '#111827')
        .style('font-size', '12px')
        .style('font-weight', node => this.pathIsHighlighted(node.data.path_so_far) ? 700 : 500)
        .text(node => node.data.stage_name.trim()
          ? `${node.data.stage_name} (${node.data.count})`
          : '');

      nodeGroups
        .filter(node => node.data.stage_name.trim() && !this.isEnrolledStage(node.data.stage_name))
        .append('text')
        .attr('x', node => radiusScale(node.data.count) + 8)
        .attr('y', node => 20 + (Number(node.data.label_offset_y) || 0))
        .attr('fill', '#6b7280')
        .style('font-size', '11px')
        .style('font-weight', 500)
        .text(node => {
          const eventualEnrollmentRate = this.nodeEventualEnrollmentRate(node.data);
          return `${this.formatPercent(eventualEnrollmentRate)} enroll`;
        });
    },

    showTooltip(event, node) {
      const parentCount = Number(node?.parent?.data?.count) || 0;
      const nodeCount = Number(node?.data?.count) || 0;
      const shareOfParent = parentCount > 0 ? nodeCount / parentCount : NaN;

      this.tooltip.visible = true;
      this.tooltip.html = [
        `<div style="font-weight:700; margin-bottom:4px;">${this.escapeHtml(node.data.stage_name.trim() || 'Prior stages')}</div>`,
        `<div>Path count: <strong>${nodeCount.toLocaleString()}</strong></div>`,
        `<div>Eventually enrolled: <strong>${this.formatPercent(this.nodeEventualEnrollmentRate(node.data))}</strong></div>`,
        `<div>Hidden downstream branches: <strong>${Number(node.data.hidden_child_count) || 0}</strong></div>`,
        `<div>Median days in prior stage: <strong>${this.formatDays(node.data.median_days_in_previous_stage)}</strong></div>`,
        ...(Number.isFinite(node.data.synthetic_link_avg_days)
          ? [`<div>Avg days from first stage: <strong>${this.formatDays(node.data.synthetic_link_avg_days)}</strong></div>`]
          : []),
        `<div>% of parent: <strong>${this.formatPercent(shareOfParent)}</strong></div>`,
        `<div style="margin-top:4px; color:#9ca3af;">${this.escapeHtml(node.data.path_so_far)}</div>`
      ].join('');
      this.moveTooltip(event);
    },

    moveTooltip(event) {
      const hostRect = this.$refs.chartWrap?.getBoundingClientRect();
      if (!hostRect) return;
      this.tooltip.x = event.clientX - hostRect.left + 14;
      this.tooltip.y = event.clientY - hostRect.top + 14;
    },

    hideTooltip() {
      this.tooltip.visible = false;
    },

    escapeHtml(str) {
      return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px; display:flex; flex-direction:column; min-height:0; height:100%;">
    <div class="btech-row" style="align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:10px;">
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end;">
        <div style="display:flex; align-items:center; gap:.5rem;">
          <label class="btech-muted" style="font-size:.75rem;">Year</label>
          <select v-model.number="year" style="font-size:.75rem; min-width:96px;">
            <option
              v-for="optionYear in yearOptions"
              :key="optionYear"
              :value="optionYear"
            >{{ optionYear }}</option>
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:.5rem;">
          <label class="btech-muted" style="font-size:.75rem;">Program</label>
          <select v-model="selectedProgram" style="font-size:.75rem; min-width:220px; max-width:320px;">
            <option value="">All</option>
            <option
              v-for="program in programOptions"
              :key="program"
              :value="program"
            >{{ program }}</option>
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:.5rem;">
          <label class="btech-muted" style="font-size:.75rem;">Focus Stage</label>
          <select v-model="selectedStageFocus" style="font-size:.75rem; min-width:220px; max-width:320px;">
            <option value="">All</option>
            <option
              v-for="stage in stageOptions"
              :key="stage"
              :value="stage"
            >{{ stage }}</option>
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:.5rem;">
          <label class="btech-muted" style="font-size:.75rem;">Min Path Count</label>
          <input
            v-model.number="minCountThreshold"
            type="number"
            min="1"
            step="1"
            style="font-size:.75rem; width:84px;"
          />
        </div>
      </div>
    </div>

    <div class="btech-row" style="gap:8px; flex-wrap:wrap; margin-bottom:12px;">
      <span class="btech-pill">Candidacies: {{ filteredRows.length }}</span>
      <span class="btech-pill">Visible Nodes: {{ treeNodeCount }}</span>
      <span class="btech-pill">Terminal Paths: {{ terminalSummary.length }}</span>
      <span v-if="selectedStageFocus" class="btech-pill">Focus: {{ selectedStageFocus }}</span>
      <span v-if="selectedPath" class="btech-pill">Selected: {{ selectedPath }}</span>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:18px;">
      Loading admissions pathways...
    </div>

    <div v-else-if="loadError" class="btech-muted" style="text-align:center; padding:18px;">
      {{ loadError }}
    </div>

    <div v-else-if="!filteredRows.length" class="btech-muted" style="text-align:center; padding:18px;">
      No candidacies matched the current filters.
    </div>

    <div v-else ref="chartWrap" style="position:relative; flex:1 1 auto; min-height:420px; overflow:hidden;">
      <svg ref="chartSvg"></svg>

      <div
        v-if="tooltip.visible"
        v-html="tooltip.html"
        style="
          position:absolute;
          pointer-events:none;
          background:#111827;
          color:#ffffff;
          border-radius:8px;
          padding:10px 12px;
          font-size:12px;
          line-height:1.45;
          box-shadow:0 10px 30px rgba(0,0,0,.22);
          max-width:320px;
          z-index:3;
        "
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      ></div>
    </div>
  </div>
  `
});
