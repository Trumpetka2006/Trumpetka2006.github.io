window.onload = async () => {
    try {
        let booklist = await bookSelectorGenerateHTMLContent('data/booklist.txt');
        let categoryElements = document.querySelectorAll('.book-selector-header');

        categoryElements.forEach(element => {
            element.addEventListener('click', function (event) {
                showHideCategory(event.currentTarget.parentElement);
                if (window.getSelection) { window.getSelection().removeAllRanges(); }
                else if (document.selection) { document.selection.empty(); }
            });
        });

        let recordElements = document.querySelectorAll('.book-selector-record');

        recordElements.forEach(element => {
            element.addEventListener('click', function (event) {
                selectUnselectRecord(event.currentTarget);
                updateInfo(booklist);
            });
        });

        updateInfo(booklist);

        document.getElementById('book-selector-generate-pdf-button').addEventListener('click', function (event) {
            validateAndDownload(event, booklist);
        })

        document.getElementById('book-selector-sign').innerText = 'created by Daniel Hut';

    } catch (error) {
        console.error(error);
        document.getElementById('book-selector-main').innerHTML = `<div class="book-selector-info book-selector-info-nok">Vyskytla se chyba</div>`
    }

}
