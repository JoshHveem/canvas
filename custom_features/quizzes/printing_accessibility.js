// Add CSS to hide .answer_input on print
$(document).ready(function () {
   $(`<style>
    @media print { 
        .answer_input { display: none !important; } 
        div.answer_label::before { content: "⚪ "; } 
        div.move { display: none !important; }
        .display_question { page-break-inside: avoid; border: 1px solid #AAA;  padding: 0.25rem; margin: 0.25rem; }
        .display_question .header { background-color: #EEE; padding: 0.25rem; }
        span.question_points_holder { float: right; }
      }

    </style>`).appendTo('head');

   });