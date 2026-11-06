"""
make_reference.py - Genera tools/reference.docx (plantilla de estilos para Pandoc).

Parte de la plantilla por defecto de Pandoc y reemplaza:
  - word/styles.xml   estilos del documento (azul institucional FIIS, tipografia, tablas)
  - encabezado y pie  (titulo del documento y numero de pagina; la caratula queda limpia)
  - seccion           A4, margenes de 2.5 cm

Uso:  python tools/make_reference.py      (luego: node tools/build.mjs)
"""

import pathlib
import re
import subprocess
import tempfile
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "reference.docx"

# Paleta institucional de Ingeniería en Informática y Sistemas (azul del logotipo FIIS)
AZUL = "1B3A8C"
AZUL_OSCURO = "0F2557"
TINTA = "1E2433"
GRIS = "5A6478"
CELESTE = "E8EEF8"
CELESTE_CLARO = "F3F6FB"
BORDE = "C9D3E6"

F_TITULOS = "Cambria"
F_TEXTO = "Calibri"
F_CODIGO = "Consolas"

ENCABEZADO = "Cuy-System · Documento de Diseño Detallado de Software"

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'


def fonts(f):
    return f'<w:rFonts w:ascii="{f}" w:hAnsi="{f}" w:cs="{f}" w:eastAsia="{f}"/>'


def pstyle(sid, name, ppr="", rpr="", based="Normal", nxt=None, extra=""):
    nxt = f'<w:next w:val="{nxt}"/>' if nxt else ""
    based = f'<w:basedOn w:val="{based}"/>' if based else ""
    return (
        f'<w:style w:type="paragraph" w:customStyle="1" w:styleId="{sid}"><w:name w:val="{name}"/>'
        f"{based}{nxt}{extra}<w:qFormat/><w:pPr>{ppr}</w:pPr><w:rPr>{rpr}</w:rPr></w:style>"
    )


def heading(n, size, color, before, after, font=F_TITULOS, italic=False, border=False, page_break=False):
    ppr = (
        ("<w:pageBreakBefore/>" if page_break else "")
        + "<w:keepNext/><w:keepLines/>"
        + (f'<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="{AZUL}"/></w:pBdr>' if border else "")
        + f'<w:spacing w:before="{before}" w:after="{after}" w:line="240" w:lineRule="auto"/>'
        + f'<w:jc w:val="left"/><w:outlineLvl w:val="{n - 1}"/>'
    )
    rpr = fonts(font) + "<w:b/><w:bCs/>" + ("<w:i/>" if italic else "") + f'<w:color w:val="{color}"/><w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    return (
        f'<w:style w:type="paragraph" w:styleId="Heading{n}"><w:name w:val="heading {n}"/>'
        f'<w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:uiPriority w:val="9"/><w:qFormat/>'
        f"<w:pPr>{ppr}</w:pPr><w:rPr>{rpr}</w:rPr></w:style>"
    )


def build_styles():
    s = []
    s.append(
        f"""<w:docDefaults><w:rPrDefault><w:rPr>{fonts(F_TEXTO)}<w:color w:val="{TINTA}"/>
<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-PE" w:eastAsia="es-PE" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>"""
    )
    s.append('<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>')
    s.append('<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style>')
    s.append(
        '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:semiHidden/>'
        '<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>'
        '<w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>'
    )

    # Texto
    s.append(pstyle("BodyText", "Body Text", '<w:spacing w:before="100" w:after="140"/><w:jc w:val="both"/>'))
    s.append(pstyle("FirstParagraph", "First Paragraph", "", "", based="BodyText", nxt="BodyText"))
    s.append(pstyle("Compact", "Compact", '<w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/>', based="BodyText"))
    s.append(pstyle("BlockText", "Block Text",
                    f'<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="{AZUL}"/></w:pBdr><w:ind w:left="360"/>',
                    f'<w:i/><w:color w:val="{GRIS}"/>', based="BodyText"))
    s.append(pstyle("SourceCode", "Source Code",
                    f'<w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="{AZUL}"/></w:pBdr>'
                    f'<w:shd w:val="clear" w:color="auto" w:fill="{CELESTE_CLARO}"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="240"/><w:jc w:val="left"/>',
                    fonts(F_CODIGO) + '<w:sz w:val="17"/><w:szCs w:val="17"/>'))
    s.append(pstyle("Logo", "Logo", '<w:jc w:val="center"/><w:spacing w:before="360" w:after="120"/>'))
    s.append(pstyle("Bibliography", "Bibliography", '<w:ind w:left="720" w:hanging="720"/><w:spacing w:after="160"/><w:jc w:val="left"/>', based="BodyText"))

    # Titulos
    s.append(heading(1, 36, AZUL, 0, 280, border=True, page_break=True))
    s.append(heading(2, 28, AZUL_OSCURO, 360, 120))
    s.append(heading(3, 24, AZUL, 240, 80))
    s.append(heading(4, 22, AZUL_OSCURO, 180, 60, font=F_TEXTO, italic=True))
    for n in range(5, 10):
        s.append(heading(n, 22, AZUL_OSCURO, 160, 60, font=F_TEXTO, italic=True))

    s.append(pstyle("Title", "Title", '<w:jc w:val="center"/><w:spacing w:after="240"/>', fonts(F_TITULOS) + f'<w:b/><w:color w:val="{AZUL}"/><w:sz w:val="40"/>'))
    s.append(pstyle("Subtitle", "Subtitle", '<w:jc w:val="center"/>', fonts(F_TITULOS) + f'<w:color w:val="{AZUL_OSCURO}"/><w:sz w:val="28"/>'))
    for sid in ("Author", "Date", "AbstractTitle", "Abstract", "Definition", "DefinitionTerm", "FootnoteBlockText"):
        s.append(pstyle(sid, sid))
    s.append(pstyle("FootnoteText", "footnote text", '<w:spacing w:after="40"/>', '<w:sz w:val="18"/>'))

    # Figuras y leyendas
    s.append(pstyle("Figure", "Figure", '<w:keepNext/><w:jc w:val="center"/><w:spacing w:before="160" w:after="60"/>'))
    s.append(pstyle("CaptionedFigure", "Captioned Figure", "", "", based="Figure"))
    cap_ppr = '<w:jc w:val="center"/><w:spacing w:before="40" w:after="280"/>'
    cap_rpr = f'<w:i/><w:color w:val="{GRIS}"/><w:sz w:val="18"/><w:szCs w:val="18"/>'
    s.append(pstyle("Caption", "caption", cap_ppr, cap_rpr))
    s.append(pstyle("ImageCaption", "Image Caption", "", "", based="Caption"))
    s.append(pstyle("TableCaption", "Table Caption", '<w:keepNext/><w:jc w:val="left"/><w:spacing w:before="200" w:after="80"/>', "", based="Caption"))

    # Indice
    s.append(pstyle("TOCHeading", "TOC Heading", '<w:jc w:val="center"/><w:spacing w:before="0" w:after="360"/>',
                    fonts(F_TITULOS) + f'<w:b/><w:color w:val="{AZUL}"/><w:sz w:val="36"/>'))
    s.append(pstyle("TOC1", "toc 1", '<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9060"/></w:tabs><w:spacing w:before="160" w:after="40"/>',
                    f'<w:b/><w:color w:val="{AZUL_OSCURO}"/>', nxt="Normal"))
    s.append(pstyle("TOC2", "toc 2", '<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9060"/></w:tabs><w:spacing w:before="0" w:after="20"/><w:ind w:left="240"/>', "", nxt="Normal"))
    s.append(pstyle("TOC3", "toc 3", '<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9060"/></w:tabs><w:spacing w:before="0" w:after="20"/><w:ind w:left="480"/>',
                    f'<w:color w:val="{GRIS}"/><w:sz w:val="20"/>', nxt="Normal"))

    # Encabezado y pie
    hf_rpr = f'<w:color w:val="{GRIS}"/><w:sz w:val="17"/><w:szCs w:val="17"/>'
    s.append(pstyle("Header", "header", '<w:tabs><w:tab w:val="right" w:pos="9060"/></w:tabs><w:spacing w:after="0"/>', hf_rpr))
    s.append(pstyle("Footer", "footer", '<w:jc w:val="center"/><w:spacing w:after="0"/>', hf_rpr))

    # Caracteres
    def cstyle(sid, name, rpr):
        return f'<w:style w:type="character" w:customStyle="1" w:styleId="{sid}"><w:name w:val="{name}"/><w:rPr>{rpr}</w:rPr></w:style>'

    s.append(cstyle("BodyTextChar", "Body Text Char", ""))
    s.append(cstyle("VerbatimChar", "Verbatim Char",
                    fonts(F_CODIGO) + f'<w:color w:val="{AZUL_OSCURO}"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:shd w:val="clear" w:color="auto" w:fill="{CELESTE}"/>'))
    s.append(cstyle("SectionNumber", "Section Number", ""))
    s.append(cstyle("FootnoteReference", "Footnote Reference", '<w:vertAlign w:val="superscript"/>'))
    s.append(cstyle("Hyperlink", "Hyperlink", f'<w:color w:val="{AZUL}"/><w:u w:val="single"/>'))

    # Tabla: encabezado guinda, filas alternas crema, lineas horizontales finas
    s.append(
        f"""<w:style w:type="table" w:styleId="Table"><w:name w:val="Table"/><w:basedOn w:val="TableNormal"/>
<w:pPr><w:spacing w:before="30" w:after="30" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr>
<w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr>
<w:tblPr><w:tblStyleRowBandSize w:val="1"/><w:jc w:val="center"/>
<w:tblBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="{AZUL}"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="{AZUL}"/>
<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{BORDE}"/></w:tblBorders>
<w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblStylePr w:type="firstRow"><w:pPr><w:keepNext/></w:pPr><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/></w:rPr>
<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{AZUL}"/><w:vAlign w:val="center"/></w:tcPr></w:tblStylePr>
<w:tblStylePr w:type="band2Horz"><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{CELESTE_CLARO}"/></w:tcPr></w:tblStylePr>
</w:style>"""
    )
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles {W}>' + "".join(s) + "</w:styles>"


HEADER_XML = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr {W} {R}><w:p><w:pPr><w:pStyle w:val="Header"/>
<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="{BORDE}"/></w:pBdr><w:jc w:val="right"/></w:pPr>
<w:r><w:t xml:space="preserve">{ENCABEZADO}</w:t></w:r></w:p></w:hdr>"""

FOOTER_XML = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr {W} {R}><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr>
<w:r><w:t xml:space="preserve">Página </w:t></w:r>
<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>
</w:p></w:ftr>"""

SECT_PR = """<w:sectPr>
<w:headerReference w:type="default" r:id="rIdFzHeader"/>
<w:footerReference w:type="default" r:id="rIdFzFooter"/>
<w:footnotePr><w:numRestart w:val="eachSect"/></w:footnotePr>
<w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="567" w:gutter="0"/>
<w:titlePg/>
</w:sectPr>"""


def main():
    with tempfile.TemporaryDirectory() as tmp:
        base = pathlib.Path(tmp) / "default.docx"
        subprocess.run(["pandoc", "-o", str(base), "--print-default-data-file", "reference.docx"], check=True)
        with zipfile.ZipFile(base) as zin:
            files = {n: zin.read(n) for n in zin.namelist()}

    files["word/styles.xml"] = build_styles().encode("utf-8")
    files["word/header1.xml"] = HEADER_XML.encode("utf-8")
    files["word/footer1.xml"] = FOOTER_XML.encode("utf-8")

    doc = files["word/document.xml"].decode("utf-8")
    if "xmlns:r=" not in doc[:2000]:
        doc = doc.replace("<w:document ", f"<w:document {R} ", 1)
    doc = re.sub(r"<w:sectPr>.*?</w:sectPr>", SECT_PR, doc, flags=re.S)
    files["word/document.xml"] = doc.encode("utf-8")

    rels = files["word/_rels/document.xml.rels"].decode("utf-8")
    rels = rels.replace(
        "</Relationships>",
        '<Relationship Id="rIdFzHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'
        '<Relationship Id="rIdFzFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
        "</Relationships>",
    )
    files["word/_rels/document.xml.rels"] = rels.encode("utf-8")

    ct = files["[Content_Types].xml"].decode("utf-8")
    ct = ct.replace(
        "</Types>",
        '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>'
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
        "</Types>",
    )
    files["[Content_Types].xml"] = ct.encode("utf-8")

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in files.items():
            zout.writestr(name, data)
    print(f"Plantilla: {OUT}")


if __name__ == "__main__":
    main()
