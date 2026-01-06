class CursorRulesConverter < Formula
  include Language::Python::Virtualenv

  desc "Convert Cursor Rules (.mdc files) to VS Code Copilot Instructions"
  homepage "https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter"
  url "https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter/archive/refs/tags/v1.1.3.tar.gz"
  sha256 "b5fc12ee959d9d555ff9ba660e67585aa8287b926e56a95f9175eb04d3feac16"
  license "MIT"

  depends_on "python@3.12"

  resource "pyyaml" do
    url "https://files.pythonhosted.org/packages/54/ed/79a089b6be93607fa5cdaedf301d7dfb23af5f25c398d5ead2525b063e17/pyyaml-6.0.2.tar.gz"
    sha256 "d584d9ec91ad65861cc08d42e834324ef890a082e591037abe114850ff7bbc3e"
  end

  def install
    virtualenv_install_with_resources

    # Install preset configurations
    (prefix/"presets").install ".convertmdcrc.dev"
    (prefix/"presets").install ".convertmdcrc.prod"
    (prefix/"presets").install ".convertmdcrc.preview"

    # Install documentation
    doc.install "README.md"
    doc.install "docs/FEATURES.md"
    doc.install "docs/CHANGELOG.md"
  end

  test do
    system bin/"convertmdc", "--version"
    system bin/"cursor-convert", "--help"
    
    # Test basic conversion
    (testpath/"test.mdc").write <<~EOS
      ---
      alwaysApply: true
      ---
      rules:
        - id: test.rule
          description: Test rule
          severity: error
    EOS
    
    system bin/"convertmdc", "--dry-run", testpath/"test.mdc"
  end
end
