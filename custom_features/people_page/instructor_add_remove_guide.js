(function() {
    $("#content").prepend(`
        <style>
            /* Hide the summary when the details element is open */
            details[open] > summary {
                display: none;
            }
        </style>

        <div style="background-color: white; position:relative; left: 0; bottom: 0;" class="ic-notification ic-notification--danger">
            <div class="ic-notification__icon" role="presentation">
                <i class="icon-info"></i>
                <span class="screenreader-only">information</span>
            </div>
            <div class="ic-notification__content">
                <div class="ic-notification__message">

                    <!-- FIRST TABLE (Always visible) -->
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <tr>
                            <th style="padding:4px;"></th>
                            <th style="padding:4px;">CS Students</th>
                            <th style="padding:4px;">CE Students</th>
                            <th style="padding:4px;">HS Students</th>
                            <th style="padding:4px;">Instructors</th>
                        </tr>
                        <tr>
                            <td style="padding:4px; width: 15rem;"><strong>Manually Add / Remove?</strong></td>
                            <td style="padding:4px;">❌ No</td>
                            <td style="padding:4px;">❌ No</td>
                            <td style="padding:4px;">✔️ Yes</td>
                            <td style="padding:4px;">✔️ Yes</td>
                        </tr>
                    </table>

                    <hr>

                    <!-- EXPANDABLE SECTION -->
                    <details>
                        <summary style="cursor:pointer; font-weight:bold; padding:4px 0;">
                            Which removal method should I use?
                        </summary>

                        <table style="width:100%; border-collapse:collapse; text-align:left; margin-top:8px;">
                            <tr>
                                <th style="padding:4px; width: 15rem;">Removal Method</th>
                                <th style="padding:4px;">Appears on Transcript</th>
                                <th style="padding:4px;">Appears in Gradebook</th>
                                <th style="padding:4px;">Scenario</th>
                            </tr>

                            <tr>
                                <td style="padding:4px;"><strong>Conclude</strong></td>
                                <td style="padding:4px;">✔️ Yes</td>
                                <td style="padding:4px;">✔️ Yes</td>
                                <td style="padding:4px;">Student finished the course</td>
                            </tr>

                            <tr>
                                <td style="padding:4px;"><strong>Deactivate</strong></td>
                                <td style="padding:4px;">❌ No</td>
                                <td style="padding:4px;">✔️ Yes</td>
                                <td style="padding:4px;">Began but did not finish the course</td>
                            </tr>

                            <tr>
                                <td style="padding:4px;"><strong>Delete</strong></td>
                                <td style="padding:4px;">❌ No</td>
                                <td style="padding:4px;">❌ No</td>
                                <td style="padding:4px;">Accidentally added to the wrong course</td>
                            </tr>
                        </table>
                    </details>

                </div>
            </div>
        </div>
    `);
})();
